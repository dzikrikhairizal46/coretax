"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Calculator, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

interface TaxCalculation {
  id: string
  userId: string
  taxType: string
  calculationType: string
  period: string
  year: number
  grossIncome: number
  deductibleExpenses?: number
  taxDeductions?: number
  taxCredits?: number
  previousTaxPaid?: number
  taxableIncome: number
  taxRate: number
  calculatedTax: number
  finalTaxAmount: number
  status: string
  calculationData: string
  notes?: string
  verifiedAt?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name?: string
    email: string
    role: string
  }
}

const calculationFormSchema = z.object({
  taxType: z.string().min(1, "Jenis pajak harus dipilih"),
  calculationType: z.string().min(1, "Tipe perhitungan harus dipilih"),
  period: z.string().min(1, "Periode harus diisi"),
  year: z.string().min(4, "Tahun harus valid"),
  grossIncome: z.string().min(1, "Penghasilan kotor harus diisi"),
  deductibleExpenses: z.string().optional(),
  taxDeductions: z.string().optional(),
  taxCredits: z.string().optional(),
  previousTaxPaid: z.string().optional(),
  notes: z.string().optional()
})

type CalculationFormData = z.infer<typeof calculationFormSchema>

export function TaxCalculator({ userRole }: { userRole?: string }) {
  const [calculations, setCalculations] = useState<TaxCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTaxType, setFilterTaxType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterYear, setFilterYear] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCalculation, setEditingCalculation] = useState<TaxCalculation | null>(null)
  const [selectedCalculation, setSelectedCalculation] = useState<TaxCalculation | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  const form = useForm<CalculationFormData>({
    resolver: zodResolver(calculationFormSchema),
    defaultValues: {
      taxType: "",
      calculationType: "",
      period: "",
      year: new Date().getFullYear().toString(),
      grossIncome: "",
      deductibleExpenses: "",
      taxDeductions: "",
      taxCredits: "",
      previousTaxPaid: "",
      notes: ""
    }
  })

  useEffect(() => {
    fetchCalculations()
  }, [])

  const fetchCalculations = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterTaxType) params.append('taxType', filterTaxType)
      if (filterStatus) params.append('status', filterStatus)
      if (filterYear) params.append('year', filterYear)

      const response = await fetch(`/api/tax-calculations?${params}`)
      const data = await response.json()
      setCalculations(data.calculations || [])
    } catch (error) {
      console.error('Error fetching tax calculations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCalculation = async (data: CalculationFormData) => {
    try {
      const payload = {
        ...data,
        grossIncome: parseFloat(data.grossIncome),
        deductibleExpenses: data.deductibleExpenses ? parseFloat(data.deductibleExpenses) : undefined,
        taxDeductions: data.taxDeductions ? parseFloat(data.taxDeductions) : undefined,
        taxCredits: data.taxCredits ? parseFloat(data.taxCredits) : undefined,
        previousTaxPaid: data.previousTaxPaid ? parseFloat(data.previousTaxPaid) : undefined
      }

      const response = await fetch('/api/tax-calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await fetchCalculations()
        setIsDialogOpen(false)
        form.reset()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal membuat perhitungan pajak')
      }
    } catch (error) {
      console.error('Error creating tax calculation:', error)
      alert('Gagal membuat perhitungan pajak')
    }
  }

  const handleUpdateCalculation = async (data: CalculationFormData) => {
    if (!editingCalculation) return

    try {
      const payload = {
        ...data,
        grossIncome: parseFloat(data.grossIncome),
        deductibleExpenses: data.deductibleExpenses ? parseFloat(data.deductibleExpenses) : undefined,
        taxDeductions: data.taxDeductions ? parseFloat(data.taxDeductions) : undefined,
        taxCredits: data.taxCredits ? parseFloat(data.taxCredits) : undefined,
        previousTaxPaid: data.previousTaxPaid ? parseFloat(data.previousTaxPaid) : undefined
      }

      const response = await fetch(`/api/tax-calculations/${editingCalculation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await fetchCalculations()
        setIsDialogOpen(false)
        setEditingCalculation(null)
        form.reset()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal update perhitungan pajak')
      }
    } catch (error) {
      console.error('Error updating tax calculation:', error)
      alert('Gagal update perhitungan pajak')
    }
  }

  const handleDeleteCalculation = async (calculationId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus perhitungan ini?')) return

    try {
      const response = await fetch(`/api/tax-calculations/${calculationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCalculations()
      } else {
        alert('Gagal menghapus perhitungan pajak')
      }
    } catch (error) {
      console.error('Error deleting tax calculation:', error)
      alert('Gagal menghapus perhitungan pajak')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: "Draft", variant: "secondary" as const, icon: FileText },
      CALCULATED: { label: "Dihitung", variant: "default" as const, icon: Calculator },
      VERIFIED: { label: "Terverifikasi", variant: "default" as const, icon: CheckCircle },
      APPROVED: { label: "Disetujui", variant: "default" as const, icon: CheckCircle },
      REJECTED: { label: "Ditolak", variant: "destructive" as const, icon: AlertTriangle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTaxTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PPH_21: "PPh Pasal 21",
      PPH_23: "PPh Pasal 23",
      PPH_25: "PPh Pasal 25",
      PPN: "PPN",
      PBB: "PBB",
      BPHTB: "BPHTB",
      PAJAK_KENDARAAN: "Pajak Kendaraan"
    }
    return labels[type] || type
  }

  const getCalculationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MONTHLY: "Bulanan",
      QUARTERLY: "Kuartalan",
      SEMI_ANNUAL: "Semesteran",
      ANNUAL: "Tahunan",
      SPECIAL: "Khusus"
    }
    return labels[type] || type
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: id })
  }

  const filteredCalculations = calculations.filter(calculation => {
    const matchesSearch = !searchTerm || 
      calculation.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calculation.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calculation.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTaxType = !filterTaxType || filterTaxType === "ALL" || calculation.taxType === filterTaxType
    const matchesStatus = !filterStatus || filterStatus === "ALL" || calculation.status === filterStatus
    const matchesYear = !filterYear || filterYear === "ALL" || calculation.year.toString() === filterYear
    
    return matchesSearch && matchesTaxType && matchesStatus && matchesYear
  })

  const tabCalculations = filteredCalculations.filter(calculation => {
    switch (activeTab) {
      case "draft": return calculation.status === "DRAFT"
      case "calculated": return calculation.status === "CALCULATED"
      case "verified": return calculation.status === "VERIFIED"
      case "approved": return calculation.status === "APPROVED"
      default: return true
    }
  })

  const calculationStats = {
    total: calculations.length,
    draft: calculations.filter(c => c.status === 'DRAFT').length,
    calculated: calculations.filter(c => c.status === 'CALCULATED').length,
    verified: calculations.filter(c => c.status === 'VERIFIED').length,
    approved: calculations.filter(c => c.status === 'APPROVED').length,
    totalTax: calculations.reduce((sum, c) => sum + c.finalTaxAmount, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Kalkulator Pajak</h3>
          <p className="text-slate-600 dark:text-slate-300">
            Hitung pajak otomatis dengan berbagai jenis pajak
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCalculation(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Hitung Pajak Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCalculation ? "Edit Perhitungan Pajak" : "Hitung Pajak Baru"}
              </DialogTitle>
              <DialogDescription>
                Masukkan data untuk menghitung pajak secara otomatis
              </DialogDescription>
            </DialogHeader>
            <CalculationForm 
              form={form}
              onSubmit={editingCalculation ? handleUpdateCalculation : handleCreateCalculation}
              initialData={editingCalculation}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Perhitungan</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculationStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Semua perhitungan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculationStats.draft}</div>
            <p className="text-xs text-muted-foreground">
              Menunggu perhitungan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dihitung</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{calculationStats.calculated}</div>
            <p className="text-xs text-muted-foreground">
              Sudah dihitung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terverifikasi</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{calculationStats.verified}</div>
            <p className="text-xs text-muted-foreground">
              Terverifikasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{calculationStats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Disetujui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pajak</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(calculationStats.totalTax)}
            </div>
            <p className="text-xs text-muted-foreground">
              Jumlah total pajak
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari perhitungan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterTaxType} onValueChange={setFilterTaxType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Jenis Pajak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Jenis</SelectItem>
                <SelectItem value="PPH_21">PPh 21</SelectItem>
                <SelectItem value="PPH_23">PPh 23</SelectItem>
                <SelectItem value="PPH_25">PPh 25</SelectItem>
                <SelectItem value="PPN">PPN</SelectItem>
                <SelectItem value="PBB">PBB</SelectItem>
                <SelectItem value="BPHTB">BPHTB</SelectItem>
                <SelectItem value="PAJAK_KENDARAAN">Pajak Kendaraan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CALCULATED">Dihitung</SelectItem>
                <SelectItem value="VERIFIED">Terverifikasi</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua</SelectItem>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="calculated">Dihitung</TabsTrigger>
          <TabsTrigger value="verified">Terverifikasi</TabsTrigger>
          <TabsTrigger value="approved">Disetujui</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {/* Calculations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Perhitungan Pajak</CardTitle>
              <CardDescription>
                {tabCalculations.length} perhitungan ditemukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tabCalculations.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Tidak ada perhitungan pajak ditemukan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jenis Pajak</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Penghasilan Kotor</TableHead>
                        <TableHead>Pajak Dihitung</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dibuat Oleh</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabCalculations.map((calculation) => (
                        <TableRow key={calculation.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{getTaxTypeLabel(calculation.taxType)}</div>
                              <div className="text-sm text-muted-foreground">
                                {getCalculationTypeLabel(calculation.calculationType)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{calculation.period}</div>
                              <div className="text-sm text-muted-foreground">{calculation.year}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(calculation.grossIncome)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{formatCurrency(calculation.finalTaxAmount)}</div>
                              <div className="text-sm text-muted-foreground">
                                {(calculation.taxRate * 100).toFixed(1)}%
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(calculation.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {calculation.user.name || calculation.user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(calculation.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCalculation(calculation)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {userRole !== 'WAJIB_PAJAK' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCalculation(calculation)
                                    setIsDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCalculation(calculation.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Calculation Detail Dialog */}
      {selectedCalculation && (
        <Dialog open={!!selectedCalculation} onOpenChange={() => setSelectedCalculation(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Perhitungan Pajak</DialogTitle>
              <DialogDescription>
                {getTaxTypeLabel(selectedCalculation.taxType)} - {selectedCalculation.period} {selectedCalculation.year}
              </DialogDescription>
            </DialogHeader>
            <CalculationDetail calculation={selectedCalculation} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function CalculationForm({ 
  form, 
  onSubmit, 
  initialData 
}: { 
  form: any
  onSubmit: (data: CalculationFormData) => void
  initialData?: TaxCalculation | null
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="taxType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Pajak</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis pajak" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PPH_21">PPh Pasal 21</SelectItem>
                    <SelectItem value="PPH_23">PPh Pasal 23</SelectItem>
                    <SelectItem value="PPH_25">PPh Pasal 25</SelectItem>
                    <SelectItem value="PPN">PPN</SelectItem>
                    <SelectItem value="PBB">PBB</SelectItem>
                    <SelectItem value="BPHTB">BPHTB</SelectItem>
                    <SelectItem value="PAJAK_KENDARAAN">Pajak Kendaraan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="calculationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Perhitungan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe perhitungan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Bulanan</SelectItem>
                    <SelectItem value="QUARTERLY">Kuartalan</SelectItem>
                    <SelectItem value="SEMI_ANNUAL">Semesteran</SelectItem>
                    <SelectItem value="ANNUAL">Tahunan</SelectItem>
                    <SelectItem value="SPECIAL">Khusus</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Periode</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Januari, Q1, Semester 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tahun</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="2024" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="grossIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Penghasilan Kotor (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deductibleExpenses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Biaya Dikurangkan (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taxDeductions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pengurang Pajak (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taxCredits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kredit Pajak (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="previousTaxPaid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pajak Sebelumnya Dibayar (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tambahkan catatan untuk perhitungan ini..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit">
            {initialData ? "Update Perhitungan" : "Hitung Pajak"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function CalculationDetail({ calculation }: { calculation: TaxCalculation }) {
  const breakdown = JSON.parse(calculation.calculationData)
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jenis Pajak</span>
              <span className="font-medium">{calculation.taxType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipe Perhitungan</span>
              <span className="font-medium">{calculation.calculationType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Periode</span>
              <span className="font-medium">{calculation.period} {calculation.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{calculation.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dibuat Oleh</span>
              <span className="font-medium">{calculation.user.name || calculation.user.email}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Waktu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dibuat</span>
              <span className="font-medium">{new Date(calculation.createdAt).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diperbarui</span>
              <span className="font-medium">{new Date(calculation.updatedAt).toLocaleString('id-ID')}</span>
            </div>
            {calculation.verifiedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diverifikasi</span>
                <span className="font-medium">{new Date(calculation.verifiedAt).toLocaleString('id-ID')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calculation Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detail Perhitungan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span>Penghasilan Kotor</span>
              <span className="font-bold">{formatCurrency(breakdown.grossIncome)}</span>
            </div>
            
            {breakdown.deductibleExpenses > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biaya Dikurangkan</span>
                <span className="text-red-600">- {formatCurrency(breakdown.deductibleExpenses)}</span>
              </div>
            )}
            
            <div className="border-t pt-3">
              <div className="flex justify-between font-medium">
                <span>Penghasilan Kena Pajak</span>
                <span>{formatCurrency(calculation.taxableIncome)}</span>
              </div>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <div>
                  <div>Pajak Dihitung</div>
                  <div className="text-sm text-muted-foreground">
                    Tarif: {formatPercentage(calculation.taxRate)}
                  </div>
                </div>
                <span className="font-bold text-lg">{formatCurrency(calculation.calculatedTax)}</span>
              </div>
            </div>
            
            {breakdown.taxDeductions > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pengurang Pajak</span>
                <span className="text-green-600">- {formatCurrency(breakdown.taxDeductions)}</span>
              </div>
            )}
            
            {breakdown.taxCredits > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kredit Pajak</span>
                <span className="text-green-600">- {formatCurrency(breakdown.taxCredits)}</span>
              </div>
            )}
            
            {breakdown.previousTaxPaid > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pajak Sebelumnya Dibayar</span>
                <span className="text-green-600">- {formatCurrency(breakdown.previousTaxPaid)}</span>
              </div>
            )}
            
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Jumlah Akhir</span>
                <span className="text-green-600">{formatCurrency(calculation.finalTaxAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metode Perhitungan</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {breakdown.description || `Perhitungan menggunakan metode ${breakdown.method} dengan tarif ${formatPercentage(calculation.taxRate)}`}
            </AlertDescription>
          </Alert>
          
          {breakdown.brackets && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Tarif Progresif:</h4>
              <div className="space-y-1 text-sm">
                {breakdown.brackets.map((bracket: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>
                      {bracket.max ? `Sampai Rp ${formatCurrency(bracket.max)}` : `Di atas Rp ${formatCurrency(bracket.above)}`}
                    </span>
                    <span>{formatPercentage(bracket.rate)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {calculation.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{calculation.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}