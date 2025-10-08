"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  MoreHorizontal,
  Download,
  Eye
} from "lucide-react"

interface RecentReportsProps {
  userRole?: string
}

export function RecentReports({ userRole = "WAJIB_PAJAK" }: RecentReportsProps) {
  // Dummy data untuk demo
  const reports = [
    {
      id: "1",
      type: "PPN Masa Pajak",
      period: "November 2024",
      amount: 45000000,
      status: "SUBMITTED",
      submittedAt: "2024-11-28",
      dueDate: "2024-11-30",
    },
    {
      id: "2", 
      type: "PPh Pasal 21",
      period: "November 2024",
      amount: 28000000,
      status: "VERIFIED",
      submittedAt: "2024-11-25",
      dueDate: "2024-11-30",
    },
    {
      id: "3",
      type: "PPh Pasal 23",
      period: "November 2024", 
      amount: 15000000,
      status: "DRAFT",
      submittedAt: null,
      dueDate: "2024-11-30",
    },
    {
      id: "4",
      type: "PPN Masa Pajak",
      period: "Oktober 2024",
      amount: 42000000,
      status: "APPROVED",
      submittedAt: "2024-10-30",
      dueDate: "2024-10-31",
    },
    {
      id: "5",
      type: "PPh Pasal 25",
      period: "Oktober 2024",
      amount: 35000000,
      status: "REJECTED",
      submittedAt: "2024-10-28",
      dueDate: "2024-10-31",
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: "Draft", variant: "secondary" as const, icon: Clock },
      SUBMITTED: { label: "Diajukan", variant: "default" as const, icon: FileText },
      VERIFIED: { label: "Diverifikasi", variant: "secondary" as const, icon: CheckCircle },
      APPROVED: { label: "Disetujui", variant: "default" as const, icon: CheckCircle },
      REJECTED: { label: "Ditolak", variant: "destructive" as const, icon: AlertTriangle },
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "APPROVED" || status === "VERIFIED") return false
    return new Date(dueDate) < new Date()
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>SPT Terkini</CardTitle>
            <CardDescription>
              Laporan SPT yang baru saja Anda ajukan atau sedang dalam proses
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Lihat Semua
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports.map((report) => {
            const overdue = isOverdue(report.dueDate, report.status)
            const daysUntilDue = getDaysUntilDue(report.dueDate)
            
            return (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{report.type}</h4>
                    {getStatusBadge(report.status)}
                    {overdue && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Terlambat
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {report.period}
                    </span>
                    <span>{formatCurrency(report.amount)}</span>
                    {report.status !== "DRAFT" && report.submittedAt && (
                      <span>Diajukan: {new Date(report.submittedAt).toLocaleDateString('id-ID')}</span>
                    )}
                  </div>
                  {report.status === "DRAFT" && !overdue && daysUntilDue <= 7 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-orange-600 mb-1">
                        <span>Jatuh tempo dalam {daysUntilDue} hari</span>
                        <span>{Math.max(0, 100 - (daysUntilDue * 14))}%</span>
                      </div>
                      <Progress value={Math.max(0, 100 - (daysUntilDue * 14))} className="h-1" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {report.status === "DRAFT" && (
                    <Button size="sm" variant="outline">
                      Lanjutkan
                    </Button>
                  )}
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
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