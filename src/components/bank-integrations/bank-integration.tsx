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
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Smartphone,
  Wifi,
  Settings,
  TestTube,
  Link,
  Unlink,
  Star,
  Activity
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

interface BankIntegration {
  id: string
  userId: string
  bankName: string
  accountNumber: string
  accountName: string
  bankCode?: string
  branch?: string
  accountType: string
  currency: string
  balance?: number
  isActive: boolean
  isPrimary: boolean
  apiCredentials?: string
  webhookUrl?: string
  lastSyncAt?: string
  syncStatus: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name?: string
    email: string
    role: string
  }
}

const bankIntegrationFormSchema = z.object({
  bankName: z.string().min(1, "Nama bank harus diisi"),
  accountNumber: z.string().min(1, "Nomor rekening harus diisi"),
  accountName: z.string().min(1, "Nama pemilik rekening harus diisi"),
  bankCode: z.string().optional(),
  branch: z.string().optional(),
  accountType: z.string().min(1, "Tipe akun harus dipilih"),
  currency: z.string().default("IDR"),
  notes: z.string().optional()
})

type BankIntegrationFormData = z.infer<typeof bankIntegrationFormSchema>

export function BankIntegration({ userRole }: { userRole?: string }) {
  const [integrations, setIntegrations] = useState<BankIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBank, setFilterBank] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterAccountType, setFilterAccountType] = useState("")
  const [filterActive, setFilterActive] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<BankIntegration | null>(null)
  const [selectedIntegration, setSelectedIntegration] = useState<BankIntegration | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  const form = useForm<BankIntegrationFormData>({
    resolver: zodResolver(bankIntegrationFormSchema),
    defaultValues: {
      bankName: "",
      accountNumber: "",
      accountName: "",
      bankCode: "",
      branch: "",
      accountType: "",
      currency: "IDR",
      notes: ""
    }
  })

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterBank) params.append('bankName', filterBank)
      if (filterStatus) params.append('status', filterStatus)
      if (filterAccountType) params.append('accountType', filterAccountType)
      if (filterActive) params.append('isActive', filterActive)

      const response = await fetch(`/api/bank-integrations?${params}`)
      const data = await response.json()
      setIntegrations(data.integrations || [])
    } catch (error) {
      console.error('Error fetching bank integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIntegration = async (data: BankIntegrationFormData) => {
    try {
      const response = await fetch('/api/bank-integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchIntegrations()
        setIsDialogOpen(false)
        form.reset()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal membuat integrasi bank')
      }
    } catch (error) {
      console.error('Error creating bank integration:', error)
      alert('Gagal membuat integrasi bank')
    }
  }

  const handleUpdateIntegration = async (data: BankIntegrationFormData) => {
    if (!editingIntegration) return

    try {
      const response = await fetch(`/api/bank-integrations/${editingIntegration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchIntegrations()
        setIsDialogOpen(false)
        setEditingIntegration(null)
        form.reset()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal update integrasi bank')
      }
    } catch (error) {
      console.error('Error updating bank integration:', error)
      alert('Gagal update integrasi bank')
    }
  }

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus integrasi bank ini?')) return

    try {
      const response = await fetch(`/api/bank-integrations/${integrationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchIntegrations()
      } else {
        alert('Gagal menghapus integrasi bank')
      }
    } catch (error) {
      console.error('Error deleting bank integration:', error)
      alert('Gagal menghapus integrasi bank')
    }
  }

  const handleSyncAction = async (integrationId: string, action: string) => {
    try {
      setSyncingId(integrationId)
      
      const response = await fetch('/api/bank-integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId,
          action
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        
        // Refresh after a delay to show sync status
        setTimeout(() => {
          fetchIntegrations()
          setSyncingId(null)
        }, 3000)
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal melakukan sinkronisasi')
        setSyncingId(null)
      }
    } catch (error) {
      console.error('Error in sync action:', error)
      alert('Gagal melakukan sinkronisasi')
      setSyncingId(null)
    }
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return (
        <Badge variant="secondary">
          <Unlink className="h-3 w-3 mr-1" />
          Non-aktif
        </Badge>
      )
    }

    const statusConfig = {
      ACTIVE: { label: "Aktif", variant: "default" as const, icon: CheckCircle },
      INACTIVE: { label: "Non-aktif", variant: "secondary" as const, icon: Unlink },
      SUSPENDED: { label: "Ditangguhkan", variant: "outline" as const, icon: Clock },
      PENDING_VERIFICATION: { label: "Menunggu Verifikasi", variant: "outline" as const, icon: Clock },
      ERROR: { label: "Error", variant: "destructive" as const, icon: AlertTriangle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getSyncStatusBadge = (syncStatus: string) => {
    const statusConfig = {
      NOT_SYNCED: { label: "Belum Sinkron", variant: "outline" as const, icon: Clock },
      SYNCING: { label: "Menyinkron", variant: "default" as const, icon: RefreshCw },
      SYNCED: { label: "Tersinkron", variant: "default" as const, icon: CheckCircle },
      FAILED: { label: "Gagal", variant: "destructive" as const, icon: AlertTriangle }
    }

    const config = statusConfig[syncStatus as keyof typeof statusConfig] || statusConfig.NOT_SYNCED
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {syncStatus === 'SYNCING' && (
          <RefreshCw className="h-3 w-3 animate-spin" />
        )}
        {syncStatus !== 'SYNCING' && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    )
  }

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SAVINGS: "Tabungan",
      CURRENT: "Giro",
      DEPOSIT: "Deposito",
      CREDIT: "Kartu Kredit",
      E_WALLET: "E-Wallet",
      VIRTUAL_ACCOUNT: "Virtual Account"
    }
    return labels[type] || type
  }

  const getAccountTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      SAVINGS: CreditCard,
      CURRENT: CreditCard,
      DEPOSIT: DollarSign,
      CREDIT: CreditCard,
      E_WALLET: Smartphone,
      VIRTUAL_ACCOUNT: Wifi
    }
    return icons[type] || CreditCard
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

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = !searchTerm || 
      integration.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesBank = !filterBank || filterBank === "ALL" || integration.bankName.toLowerCase().includes(filterBank.toLowerCase())
    const matchesStatus = !filterStatus || filterStatus === "ALL" || integration.status === filterStatus
    const matchesAccountType = !filterAccountType || filterAccountType === "ALL" || integration.accountType === filterAccountType
    const matchesActive = !filterActive || filterActive === "ALL" || 
      (filterActive === "true" && integration.isActive) || 
      (filterActive === "false" && !integration.isActive)
    
    return matchesSearch && matchesBank && matchesStatus && matchesAccountType && matchesActive
  })

  const tabIntegrations = filteredIntegrations.filter(integration => {
    switch (activeTab) {
      case "active": return integration.isActive
      case "inactive": return !integration.isActive
      case "primary": return integration.isPrimary
      case "synced": return integration.syncStatus === 'SYNCED'
      default: return true
    }
  })

  const integrationStats = {
    total: integrations.length,
    active: integrations.filter(i => i.isActive).length,
    primary: integrations.filter(i => i.isPrimary).length,
    synced: integrations.filter(i => i.syncStatus === 'SYNCED').length,
    totalBalance: integrations.reduce((sum, i) => sum + (i.balance || 0), 0)
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
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Integrasi Bank</h3>
          <p className="text-slate-600 dark:text-slate-300">
            Kelola integrasi rekening bank untuk pembayaran pajak
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingIntegration(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Integrasi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIntegration ? "Edit Integrasi Bank" : "Tambah Integrasi Bank Baru"}
              </DialogTitle>
              <DialogDescription>
                Masukkan informasi rekening bank untuk integrasi
              </DialogDescription>
            </DialogHeader>
            <BankIntegrationForm 
              form={form}
              onSubmit={editingIntegration ? handleUpdateIntegration : handleCreateIntegration}
              initialData={editingIntegration}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrasi</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrationStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Semua integrasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{integrationStats.active}</div>
            <p className="text-xs text-muted-foreground">
              Integrasi aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utama</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{integrationStats.primary}</div>
            <p className="text-xs text-muted-foreground">
              Rekening utama
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tersinkron</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{integrationStats.synced}</div>
            <p className="text-xs text-muted-foreground">
              Data tersinkron
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(integrationStats.totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total semua saldo
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
                  placeholder="Cari integrasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterBank} onValueChange={setFilterBank}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Nama Bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Bank</SelectItem>
                <SelectItem value="BCA">BCA</SelectItem>
                <SelectItem value="MANDIRI">Mandiri</SelectItem>
                <SelectItem value="BNI">BNI</SelectItem>
                <SelectItem value="BRI">BRI</SelectItem>
                <SelectItem value="BSI">BSI</SelectItem>
                <SelectItem value="CIMB">CIMB Niaga</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="INACTIVE">Non-aktif</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAccountType} onValueChange={setFilterAccountType}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Tipe Akun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Tipe</SelectItem>
                <SelectItem value="SAVINGS">Tabungan</SelectItem>
                <SelectItem value="CURRENT">Giro</SelectItem>
                <SelectItem value="DEPOSIT">Deposito</SelectItem>
                <SelectItem value="E_WALLET">E-Wallet</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Aktif" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua</SelectItem>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Non-aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="active">Aktif</TabsTrigger>
          <TabsTrigger value="inactive">Non-aktif</TabsTrigger>
          <TabsTrigger value="primary">Utama</TabsTrigger>
          <TabsTrigger value="synced">Tersinkron</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {/* Integrations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Integrasi Bank</CardTitle>
              <CardDescription>
                {tabIntegrations.length} integrasi ditemukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tabIntegrations.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Tidak ada integrasi bank ditemukan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bank & Rekening</TableHead>
                        <TableHead>Tipe Akun</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sinkronisasi</TableHead>
                        <TableHead>Dibuat Oleh</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabIntegrations.map((integration) => {
                        const AccountTypeIcon = getAccountTypeIcon(integration.accountType)
                        return (
                          <TableRow key={integration.id}>
                            <TableCell>
                              <div>
                                <div className="flex items-center gap-2">
                                  {integration.isPrimary && (
                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  )}
                                  <div className="font-medium">{integration.bankName}</div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {integration.accountNumber} - {integration.accountName}
                                </div>
                                {integration.branch && (
                                  <div className="text-xs text-muted-foreground">
                                    Cabang: {integration.branch}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <AccountTypeIcon className="h-4 w-4" />
                                <span>{getAccountTypeLabel(integration.accountType)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {integration.balance ? formatCurrency(integration.balance) : '-'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {integration.currency}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(integration.status, integration.isActive)}</TableCell>
                            <TableCell>{getSyncStatusBadge(integration.syncStatus)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {integration.user.name || integration.user.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedIntegration(integration)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {userRole !== 'WAJIB_PAJAK' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingIntegration(integration)
                                      setIsDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSyncAction(integration.id, 'SYNC_BALANCE')}
                                  disabled={syncingId === integration.id}
                                >
                                  {syncingId === integration.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteIntegration(integration.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Detail Dialog */}
      {selectedIntegration && (
        <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Integrasi Bank</DialogTitle>
              <DialogDescription>
                {selectedIntegration.bankName} - {selectedIntegration.accountNumber}
              </DialogDescription>
            </DialogHeader>
            <BankIntegrationDetail integration={selectedIntegration} onSyncAction={handleSyncAction} syncingId={syncingId} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function BankIntegrationForm({ 
  form, 
  onSubmit, 
  initialData 
}: { 
  form: any
  onSubmit: (data: BankIntegrationFormData) => void
  initialData?: BankIntegration | null
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Bank</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih nama bank" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BCA">Bank Central Asia (BCA)</SelectItem>
                    <SelectItem value="MANDIRI">Bank Mandiri</SelectItem>
                    <SelectItem value="BNI">Bank Negara Indonesia (BNI)</SelectItem>
                    <SelectItem value="BRI">Bank Rakyat Indonesia (BRI)</SelectItem>
                    <SelectItem value="BSI">Bank Syariah Indonesia (BSI)</SelectItem>
                    <SelectItem value="CIMB">CIMB Niaga</SelectItem>
                    <SelectItem value="PERMATA">Bank Permata</SelectItem>
                    <SelectItem value="DANAMON">Bank Danamon</SelectItem>
                    <SelectItem value="PANIN">Bank Panin</SelectItem>
                    <SelectItem value="LAINNYA">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Rekening</FormLabel>
                <FormControl>
                  <Input placeholder="1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Pemilik Rekening</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bankCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Bank</FormLabel>
                <FormControl>
                  <Input placeholder="014" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="branch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cabang</FormLabel>
                <FormControl>
                  <Input placeholder="Jakarta Pusat" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Akun</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe akun" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SAVINGS">Tabungan</SelectItem>
                    <SelectItem value="CURRENT">Giro</SelectItem>
                    <SelectItem value="DEPOSIT">Deposito</SelectItem>
                    <SelectItem value="CREDIT">Kartu Kredit</SelectItem>
                    <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                    <SelectItem value="VIRTUAL_ACCOUNT">Virtual Account</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mata Uang</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mata uang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
                    <SelectItem value="USD">Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="SGD">Singapore Dollar (SGD)</SelectItem>
                  </SelectContent>
                </Select>
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
                  placeholder="Tambahkan catatan untuk integrasi ini..."
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
            {initialData ? "Update Integrasi" : "Tambah Integrasi"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function BankIntegrationDetail({ 
  integration, 
  onSyncAction, 
  syncingId 
}: { 
  integration: BankIntegration
  onSyncAction: (id: string, action: string) => void
  syncingId: string | null
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID')
  }

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SAVINGS: "Tabungan",
      CURRENT: "Giro", 
      DEPOSIT: "Deposito",
      CREDIT: "Kartu Kredit",
      E_WALLET: "E-Wallet",
      VIRTUAL_ACCOUNT: "Virtual Account"
    }
    return labels[type] || type
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
              <span className="text-muted-foreground">Nama Bank</span>
              <span className="font-medium">{integration.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nomor Rekening</span>
              <span className="font-medium">{integration.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama Pemilik</span>
              <span className="font-medium">{integration.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipe Akun</span>
              <span className="font-medium">{getAccountTypeLabel(integration.accountType)}</span>
            </div>
            {integration.bankCode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kode Bank</span>
                <span className="font-medium">{integration.bankCode}</span>
              </div>
            )}
            {integration.branch && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cabang</span>
                <span className="font-medium">{integration.branch}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mata Uang</span>
              <span className="font-medium">{integration.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Utama</span>
              <span className="font-medium">{integration.isPrimary ? 'Ya' : 'Tidak'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status & Sinkronisasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status Integrasi</span>
              <span className="font-medium">{integration.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aktif</span>
              <span className="font-medium">{integration.isActive ? 'Ya' : 'Tidak'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status Sinkronisasi</span>
              <span className="font-medium">{integration.syncStatus}</span>
            </div>
            {integration.lastSyncAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Terakhir Sinkron</span>
                <span className="font-medium">{formatDate(integration.lastSyncAt)}</span>
              </div>
            )}
            {integration.balance !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo Terakhir</span>
                <span className="font-medium">{formatCurrency(integration.balance)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Rekening</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Nomor Rekening Lengkap</div>
              <div className="font-mono text-lg bg-slate-100 dark:bg-slate-800 p-3 rounded">
                {integration.accountNumber}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Nama Pemilik Rekening</div>
              <div className="font-medium text-lg">{integration.accountName}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aksi Sinkronisasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => onSyncAction(integration.id, 'SYNC_BALANCE')}
              disabled={syncingId === integration.id}
              className="flex items-center gap-2"
            >
              {syncingId === integration.id ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync Saldo
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onSyncAction(integration.id, 'SYNC_TRANSACTIONS')}
              disabled={syncingId === integration.id}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Sync Transaksi
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onSyncAction(integration.id, 'TEST_CONNECTION')}
              disabled={syncingId === integration.id}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Test Koneksi
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onSyncAction(integration.id, 'SET_WEBHOOK')}
              disabled={syncingId === integration.id}
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              Set Webhook
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Technical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Teknis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Webhook URL</div>
              <div className="font-mono text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded break-all">
                {integration.webhookUrl || 'Belum diatur'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">API Credentials</div>
              <div className="font-mono text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded">
                {integration.apiCredentials ? '*** Terenkripsi ***' : 'Belum diatur'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dibuat Oleh</span>
            <span className="font-medium">{integration.user.name || integration.user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tanggal Dibuat</span>
            <span className="font-medium">{formatDate(integration.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Terakhir Diperbarui</span>
            <span className="font-medium">{formatDate(integration.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {integration.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{integration.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}