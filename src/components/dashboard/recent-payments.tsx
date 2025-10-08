"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  MoreHorizontal,
  Download,
  Receipt
} from "lucide-react"

interface RecentPaymentsProps {
  userRole?: string
}

export function RecentPayments({ userRole = "WAJIB_PAJAK" }: RecentPaymentsProps) {
  // Dummy data untuk demo
  const payments = [
    {
      id: "PAY001",
      taxType: "PPN Masa Pajak",
      period: "November 2024",
      amount: 45000000,
      method: "BANK_TRANSFER",
      status: "SUCCESS",
      transactionId: "TRX20241128001",
      paidAt: "2024-11-28T10:30:00",
      dueDate: "2024-11-30",
    },
    {
      id: "PAY002", 
      taxType: "PPh Pasal 21",
      period: "November 2024",
      amount: 28000000,
      method: "VIRTUAL_ACCOUNT",
      status: "SUCCESS",
      transactionId: "VA20241125001",
      paidAt: "2024-11-25T14:15:00",
      dueDate: "2024-11-30",
    },
    {
      id: "PAY003",
      taxType: "PPh Pasal 23",
      period: "November 2024", 
      amount: 15000000,
      method: "BANK_TRANSFER",
      status: "PENDING",
      transactionId: null,
      paidAt: null,
      dueDate: "2024-11-30",
    },
    {
      id: "PAY004",
      taxType: "PPN Masa Pajak",
      period: "Oktober 2024",
      amount: 42000000,
      method: "E_WALLET",
      status: "SUCCESS",
      transactionId: "EW20241030001",
      paidAt: "2024-10-30T09:20:00",
      dueDate: "2024-10-31",
    },
    {
      id: "PAY005",
      taxType: "PPh Pasal 25",
      period: "Oktober 2024",
      amount: 35000000,
      method: "BANK_TRANSFER",
      status: "FAILED",
      transactionId: "TRX20241028001",
      paidAt: null,
      dueDate: "2024-10-31",
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "Menunggu", variant: "secondary" as const, icon: Clock },
      SUCCESS: { label: "Berhasil", variant: "default" as const, icon: CheckCircle },
      FAILED: { label: "Gagal", variant: "destructive" as const, icon: AlertTriangle },
      REFUNDED: { label: "Dikembalikan", variant: "secondary" as const, icon: Receipt },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getMethodBadge = (method: string) => {
    const methodConfig = {
      BANK_TRANSFER: { label: "Transfer Bank", variant: "outline" as const },
      VIRTUAL_ACCOUNT: { label: "Virtual Account", variant: "outline" as const },
      CREDIT_CARD: { label: "Kartu Kredit", variant: "outline" as const },
      E_WALLET: { label: "E-Wallet", variant: "outline" as const },
    }

    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.BANK_TRANSFER
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "SUCCESS") return false
    return new Date(dueDate) < new Date()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pembayaran Terkini</CardTitle>
            <CardDescription>
              Riwayat pembayaran pajak terbaru Anda
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Lihat Semua
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => {
            const overdue = isOverdue(payment.dueDate, payment.status)
            
            return (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{payment.taxType}</h4>
                    {getStatusBadge(payment.status)}
                    {getMethodBadge(payment.method)}
                    {overdue && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Terlambat
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{payment.period}</span>
                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    {payment.transactionId && (
                      <span>ID: {payment.transactionId}</span>
                    )}
                    {payment.paidAt && (
                      <span>Dibayar: {new Date(payment.paidAt).toLocaleDateString('id-ID')} {new Date(payment.paidAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                  {payment.status === "PENDING" && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-orange-600 mb-1">
                        <span>Menunggu pembayaran</span>
                        <span>60%</span>
                      </div>
                      <Progress value={60} className="h-1" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {payment.status === "PENDING" && (
                    <Button size="sm">
                      Bayar Sekarang
                    </Button>
                  )}
                  {payment.status === "FAILED" && (
                    <Button size="sm" variant="outline">
                      Coba Lagi
                    </Button>
                  )}
                  <Button size="sm" variant="ghost">
                    <Receipt className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}