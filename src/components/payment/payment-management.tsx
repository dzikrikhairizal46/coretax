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
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CalendarIcon, 
  Plus, 
  Search, 
  CreditCard, 
  Building, 
  Wallet, 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Receipt,
  QrCode
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface PaymentData {
  id: string
  invoiceNumber: string
  sptType: string
  sptPeriod: string
  amount: number
  dueDate: string
  status: "pending" | "processing" | "completed" | "failed" | "refunded"
  paymentMethod: string
  bankReference?: string
  createdAt: string
  paidAt?: string
}

interface PaymentFormData {
  sptId: string
  amount: number
  paymentMethod: string
  bankAccount?: string
  description: string
}

export function PaymentManagement({ userRole }: { userRole?: string }) {
  const [paymentData, setPaymentData] = useState<PaymentData[]>([
    {
      id: "1",
      invoiceNumber: "INV-2024-001",
      sptType: "SPT Masa PPN",
      sptPeriod: "Januari 2024",
      amount: 15000000,
      dueDate: "2024-02-20",
      status: "completed",
      paymentMethod: "Transfer Bank",
      bankReference: "BNI-1234567890",
      createdAt: "2024-01-15",
      paidAt: "2024-01-18"
    },
    {
      id: "2",
      invoiceNumber: "INV-2024-002",
      sptType: "SPT Tahunan PPh",
      sptPeriod: "Tahun 2023",
      amount: 50000000,
      dueDate: "2024-03-31",
      status: "pending",
      paymentMethod: "",
      createdAt: "2024-01-10"
    },
    {
      id: "3",
      invoiceNumber: "INV-2024-003",
      sptType: "SPT Masa PPh 21",
      sptPeriod: "Februari 2024",
      amount: 8500000,
      dueDate: "2024-03-20",
      status: "processing",
      paymentMethod: "Virtual Account",
      bankReference: "VA-87654321",
      createdAt: "2024-02-15"
    },
    {
      id: "4",
      invoiceNumber: "INV-2024-004",
      sptType: "SPT Masa PPh 23",
      sptPeriod: "Januari 2024",
      amount: 12000000,
      dueDate: "2024-02-20",
      status: "failed",
      paymentMethod: "Credit Card",
      bankReference: "CC-987654321",
      createdAt: "2024-01-20"
    },
    {
      id: "5",
      invoiceNumber: "INV-2024-005",
      sptType: "SPT Masa PPN",
      sptPeriod: "Desember 2023",
      amount: 18000000,
      dueDate: "2024-01-20",
      status: "completed",
      paymentMethod: "E-Wallet",
      bankReference: "EW-55555555",
      createdAt: "2023-12-15",
      paidAt: "2023-12-18"
    }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterMethod, setFilterMethod] = useState("all")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)

  const filteredPayments = paymentData.filter(payment => {
    const matchesSearch = payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.sptType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.sptPeriod.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus
    const matchesMethod = filterMethod === "all" || payment.paymentMethod === filterMethod
    
    return matchesSearch && matchesStatus && matchesMethod
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Menunggu", variant: "secondary" as const, icon: Clock },
      processing: { label: "Diproses", variant: "default" as const, icon: Clock },
      completed: { label: "Selesai", variant: "default" as const, icon: CheckCircle },
      failed: { label: "Gagal", variant: "destructive" as const, icon: XCircle },
      refunded: { label: "Dikembalikan", variant: "secondary" as const, icon: AlertTriangle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPaymentMethodIcon = (method: string) => {
    const methodIcons = {
      "Transfer Bank": Building,
      "Virtual Account": CreditCard,
      "Credit Card": CreditCard,
      "E-Wallet": Wallet,
      "QRIS": QrCode
    }
    
    const Icon = methodIcons[method as keyof typeof methodIcons] || CreditCard
    return <Icon className="h-4 w-4" />
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
    if (status === "completed") return false
    return new Date(dueDate) < new Date()
  }

  const getPaymentStats = () => {
    const total = paymentData.reduce((sum, p) => sum + p.amount, 0)
    const paid = paymentData.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)
    const pending = paymentData.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
    const overdue = paymentData.filter(p => isOverdue(p.dueDate, p.status)).length
    
    return { total, paid, pending, overdue }
  }

  const stats = getPaymentStats()

  const handleCreatePayment = (data: PaymentFormData) => {
    const newPayment: PaymentData = {
      id: (paymentData.length + 1).toString(),
      invoiceNumber: `INV-2024-${String(paymentData.length + 1).padStart(3, '0')}`,
      sptType: "SPT Masa PPN", // Default, bisa diambil dari SPT yang dipilih
      sptPeriod: "Maret 2024", // Default
      amount: data.amount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "pending",
      paymentMethod: data.paymentMethod,
      createdAt: new Date().toISOString().split('T')[0]
    }
    
    setPaymentData([...paymentData, newPayment])
    setIsPaymentDialogOpen(false)
    
    if (data.paymentMethod === "QRIS") {
      setShowQRCode(true)
    }
  }

  const paymentMethods = [
    { value: "Transfer Bank", label: "Transfer Bank" },
    { value: "Virtual Account", label: "Virtual Account" },
    { value: "Credit Card", label: "Kartu Kredit" },
    { value: "E-Wallet", label: "E-Wallet" },
    { value: "QRIS", label: "QRIS" }
  ]

  const banks = [
    { value: "bca", label: "BCA - Bank Central Asia" },
    { value: "mandiri", label: "Bank Mandiri" },
    { value: "bni", label: "BNI - Bank Negara Indonesia" },
    { value: "bri", label: "BRI - Bank Rakyat Indonesia" },
    { value: "cimb", label: "CIMB Niaga" }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Pembayaran Pajak</h3>
          <p className="text-slate-600 dark:text-slate-300">Kelola pembayaran pajak Anda dengan berbagai metode</p>
        </div>
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Buat Pembayaran
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buat Pembayaran Baru</DialogTitle>
              <DialogDescription>
                Pilih metode pembayaran untuk menyelesaikan kewajiban pajak Anda
              </DialogDescription>
            </DialogHeader>
            <PaymentForm onSubmit={handleCreatePayment} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tagihan</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">
              Semua pembayaran
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sudah Dibayar</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}% dari total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Pembayaran</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</div>
            <p className="text-xs text-muted-foreground">
              Belum dibayar
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Melewati jatuh tempo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Pembayaran</CardTitle>
          <CardDescription>
            Overview pembayaran pajak Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Total Pembayaran</span>
                <span>{Math.round((stats.paid / stats.total) * 100)}%</span>
              </div>
              <Progress value={stats.total > 0 ? (stats.paid / stats.total) * 100 : 0} className="h-2" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold">{paymentData.length}</div>
                <div className="text-muted-foreground">Total Transaksi</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">
                  {paymentData.filter(p => p.status === "completed").length}
                </div>
                <div className="text-muted-foreground">Berhasil</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">
                  {paymentData.filter(p => p.status === "pending").length}
                </div>
                <div className="text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-600">
                  {paymentData.filter(p => p.status === "failed").length}
                </div>
                <div className="text-muted-foreground">Gagal</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  placeholder="Cari pembayaran..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="processing">Diproses</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="failed">Gagal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Metode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Metode</SelectItem>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembayaran</CardTitle>
          <CardDescription>
            Daftar pembayaran pajak yang telah dilakukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Jenis SPT</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className={isOverdue(payment.dueDate, payment.status) ? "bg-red-50 dark:bg-red-900/20" : ""}>
                    <TableCell className="font-medium">{payment.invoiceNumber}</TableCell>
                    <TableCell>{payment.sptType}</TableCell>
                    <TableCell>{payment.sptPeriod}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDate(payment.dueDate)}
                        {isOverdue(payment.dueDate, payment.status) && (
                          <Badge variant="destructive" className="text-xs">Terlambat</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {payment.paymentMethod && getPaymentMethodIcon(payment.paymentMethod)}
                        <span className="text-sm">{payment.paymentMethod || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payment.status === "completed" && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {payment.status === "pending" && (
                          <Button size="sm" onClick={() => setIsPaymentDialogOpen(true)}>
                            Bayar
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

      {/* Payment Detail Dialog */}
      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Pembayaran</DialogTitle>
              <DialogDescription>
                Informasi lengkap pembayaran pajak
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Invoice Number</p>
                  <p className="text-sm">{selectedPayment.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Status</p>
                  <p className="text-sm">{getStatusBadge(selectedPayment.status)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Jenis SPT</p>
                  <p className="text-sm">{selectedPayment.sptType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Periode</p>
                  <p className="text-sm">{selectedPayment.sptPeriod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Jumlah</p>
                  <p className="text-sm font-semibold">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Jatuh Tempo</p>
                  <p className="text-sm">{formatDate(selectedPayment.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Metode Pembayaran</p>
                  <p className="text-sm">{selectedPayment.paymentMethod || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Referensi Bank</p>
                  <p className="text-sm">{selectedPayment.bankReference || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Dibuat Tanggal</p>
                  <p className="text-sm">{formatDate(selectedPayment.createdAt)}</p>
                </div>
                {selectedPayment.paidAt && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Dibayar Tanggal</p>
                    <p className="text-sm">{formatDate(selectedPayment.paidAt)}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                  Tutup
                </Button>
                {selectedPayment.status === "completed" && (
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Download Bukti
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* QR Code Payment Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran QRIS</DialogTitle>
            <DialogDescription>
              Scan QR Code berikut untuk menyelesaikan pembayaran
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="bg-gray-100 p-8 rounded-lg">
              <div className="w-48 h-48 bg-white mx-auto flex items-center justify-center border-2 border-dashed border-gray-300">
                <QrCode className="h-24 w-24 text-gray-400" />
              </div>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Selesaikan pembayaran dalam 15 menit. QR Code akan kadaluarsa secara otomatis.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowQRCode(false)}>
                Tutup
              </Button>
              <Button>
                Cek Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PaymentForm({ onSubmit }: { onSubmit: (data: PaymentFormData) => void }) {
  const [formData, setFormData] = useState<PaymentFormData>({
    sptId: "",
    amount: 0,
    paymentMethod: "",
    bankAccount: "",
    description: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const paymentMethods = [
    { value: "Transfer Bank", label: "Transfer Bank" },
    { value: "Virtual Account", label: "Virtual Account" },
    { value: "Credit Card", label: "Kartu Kredit" },
    { value: "E-Wallet", label: "E-Wallet" },
    { value: "QRIS", label: "QRIS" }
  ]

  const banks = [
    { value: "bca", label: "BCA - Bank Central Asia" },
    { value: "mandiri", label: "Bank Mandiri" },
    { value: "bni", label: "BNI - Bank Negara Indonesia" },
    { value: "bri", label: "BRI - Bank Rakyat Indonesia" },
    { value: "cimb", label: "CIMB Niaga" }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Jumlah Pembayaran (Rp)</label>
        <Input
          type="number"
          value={formData.amount || ""}
          onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
          placeholder="0"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Metode Pembayaran</label>
        <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih metode pembayaran" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map(method => (
              <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.paymentMethod === "Transfer Bank" && (
        <div>
          <label className="text-sm font-medium">Bank Tujuan</label>
          <Select value={formData.bankAccount} onValueChange={(value) => setFormData({...formData, bankAccount: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih bank tujuan" />
            </SelectTrigger>
            <SelectContent>
              {banks.map(bank => (
                <SelectItem key={bank.value} value={bank.value}>{bank.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div>
        <label className="text-sm font-medium">Keterangan</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Tambahkan keterangan jika diperlukan"
        />
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Informasi Penting</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Pastikan jumlah pembayaran sudah benar</li>
          <li>• Simpan bukti pembayaran untuk arsip</li>
          <li>• Pembayaran akan diproses dalam 1x24 jam</li>
        </ul>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setFormData({
          sptId: "",
          amount: 0,
          paymentMethod: "",
          bankAccount: "",
          description: ""
        })}>
          Reset
        </Button>
        <Button type="submit" disabled={!formData.amount || !formData.paymentMethod}>
          Proses Pembayaran
        </Button>
      </div>
    </form>
  )
}