"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Search, FileText, Eye, Edit, Trash2, Download, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface SPTData {
  id: string
  type: string
  period: string
  dueDate: string
  status: "draft" | "submitted" | "processed" | "approved" | "rejected"
  taxAmount: number
  createdAt: string
  updatedAt: string
}

interface SPTFormData {
  type: string
  period: string
  dueDate: Date
  description: string
  taxAmount: number
}

export function SPTManagement({ userRole }: { userRole?: string }) {
  const [sptData, setSptData] = useState<SPTData[]>([
    {
      id: "1",
      type: "SPT Masa PPN",
      period: "Januari 2024",
      dueDate: "2024-02-20",
      status: "submitted",
      taxAmount: 15000000,
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20"
    },
    {
      id: "2",
      type: "SPT Tahunan PPh",
      period: "Tahun 2023",
      dueDate: "2024-03-31",
      status: "draft",
      taxAmount: 50000000,
      createdAt: "2024-01-10",
      updatedAt: "2024-01-10"
    },
    {
      id: "3",
      type: "SPT Masa PPh 21",
      period: "Februari 2024",
      dueDate: "2024-03-20",
      status: "processed",
      taxAmount: 8500000,
      createdAt: "2024-02-15",
      updatedAt: "2024-02-25"
    },
    {
      id: "4",
      type: "SPT Masa PPh 23",
      period: "Januari 2024",
      dueDate: "2024-02-20",
      status: "approved",
      taxAmount: 12000000,
      createdAt: "2024-01-20",
      updatedAt: "2024-02-15"
    },
    {
      id: "5",
      type: "SPT Masa PPN",
      period: "Desember 2023",
      dueDate: "2024-01-20",
      status: "rejected",
      taxAmount: 18000000,
      createdAt: "2023-12-15",
      updatedAt: "2024-01-18"
    }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedSPT, setSelectedSPT] = useState<SPTData | null>(null)

  const filteredSPT = sptData.filter(spt => {
    const matchesSearch = spt.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         spt.period.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || spt.type === filterType
    const matchesStatus = filterStatus === "all" || spt.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const },
      submitted: { label: "Diajukan", variant: "default" as const },
      processed: { label: "Diproses", variant: "secondary" as const },
      approved: { label: "Disetujui", variant: "default" as const },
      rejected: { label: "Ditolak", variant: "destructive" as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "approved" || status === "submitted") return false
    return new Date(dueDate) < new Date()
  }

  const handleCreateSPT = (data: SPTFormData) => {
    const newSPT: SPTData = {
      id: (sptData.length + 1).toString(),
      type: data.type,
      period: data.period,
      dueDate: data.dueDate.toISOString().split('T')[0],
      status: "draft",
      taxAmount: data.taxAmount,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    
    setSptData([...sptData, newSPT])
    setIsCreateDialogOpen(false)
  }

  const sptTypes = ["SPT Masa PPN", "SPT Masa PPh 21", "SPT Masa PPh 23", "SPT Tahunan PPh", "SPT Masa PPh 25", "SPT Masa PPh 4(2)"]
  const periods = ["Januari 2024", "Februari 2024", "Maret 2024", "Tahun 2023", "Tahun 2024"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Manajemen SPT</h3>
          <p className="text-slate-600 dark:text-slate-300">Kelola Surat Pemberitahuan Pajak Anda</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Buat SPT Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buat SPT Baru</DialogTitle>
              <DialogDescription>
                Isi formulir berikut untuk membuat Surat Pemberitahuan Pajak baru
              </DialogDescription>
            </DialogHeader>
            <SPTForm onSubmit={handleCreateSPT} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SPT</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sptData.length}</div>
            <p className="text-xs text-muted-foreground">
              Semua periode
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Proses</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sptData.filter(s => s.status === "submitted" || s.status === "processed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Membutuhkan perhatian
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {sptData.filter(s => isOverdue(s.dueDate, s.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Melewati jatuh tempo
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pajak</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(sptData.reduce((sum, spt) => sum + spt.taxAmount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Nilai total SPT
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
                  placeholder="Cari SPT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Jenis SPT" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {sptTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Diajukan</SelectItem>
                <SelectItem value="processed">Diproses</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* SPT Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar SPT</CardTitle>
          <CardDescription>
            Daftar Surat Pemberitahuan Pajak yang telah dibuat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis SPT</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Jumlah Pajak</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSPT.map((spt) => (
                  <TableRow key={spt.id} className={isOverdue(spt.dueDate, spt.status) ? "bg-red-50 dark:bg-red-900/20" : ""}>
                    <TableCell className="font-medium">{spt.type}</TableCell>
                    <TableCell>{spt.period}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDate(spt.dueDate)}
                        {isOverdue(spt.dueDate, spt.status) && (
                          <Badge variant="destructive" className="text-xs">Terlambat</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(spt.status)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(spt.taxAmount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedSPT(spt)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        {userRole === "admin" && (
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SPT Detail Dialog */}
      {selectedSPT && (
        <Dialog open={!!selectedSPT} onOpenChange={() => setSelectedSPT(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail SPT</DialogTitle>
              <DialogDescription>
                Informasi lengkap Surat Pemberitahuan Pajak
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Jenis SPT</p>
                  <p className="text-sm">{selectedSPT.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Periode</p>
                  <p className="text-sm">{selectedSPT.period}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Jatuh Tempo</p>
                  <p className="text-sm">{formatDate(selectedSPT.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Status</p>
                  <p className="text-sm">{getStatusBadge(selectedSPT.status)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Jumlah Pajak</p>
                  <p className="text-sm">{formatCurrency(selectedSPT.taxAmount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Dibuat Tanggal</p>
                  <p className="text-sm">{formatDate(selectedSPT.createdAt)}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedSPT(null)}>
                  Tutup
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function SPTForm({ onSubmit }: { onSubmit: (data: SPTFormData) => void }) {
  const [formData, setFormData] = useState<SPTFormData>({
    type: "",
    period: "",
    dueDate: new Date(),
    description: "",
    taxAmount: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const sptTypes = ["SPT Masa PPN", "SPT Masa PPh 21", "SPT Masa PPh 23", "SPT Tahunan PPh", "SPT Masa PPh 25", "SPT Masa PPh 4(2)"]
  const periods = ["Januari 2024", "Februari 2024", "Maret 2024", "Tahun 2023", "Tahun 2024"]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Jenis SPT</label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis SPT" />
            </SelectTrigger>
            <SelectContent>
              {sptTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Periode</label>
          <Select value={formData.period} onValueChange={(value) => setFormData({...formData, period: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              {periods.map(period => (
                <SelectItem key={period} value={period}>{period}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Jatuh Tempo</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.dueDate ? format(formData.dueDate, "PPP", { locale: id }) : "Pilih tanggal"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.dueDate}
              onSelect={(date) => date && setFormData({...formData, dueDate: date})}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div>
        <label className="text-sm font-medium">Jumlah Pajak (Rp)</label>
        <Input
          type="number"
          value={formData.taxAmount}
          onChange={(e) => setFormData({...formData, taxAmount: Number(e.target.value)})}
          placeholder="0"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Keterangan</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Tambahkan keterangan jika diperlukan"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setFormData({
          type: "",
          period: "",
          dueDate: new Date(),
          description: "",
          taxAmount: 0
        })}>
          Reset
        </Button>
        <Button type="submit">
          Buat SPT
        </Button>
      </div>
    </form>
  )
}