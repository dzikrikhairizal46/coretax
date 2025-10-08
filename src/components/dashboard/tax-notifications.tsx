"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Calendar,
  FileText,
  CreditCard,
  MoreHorizontal
} from "lucide-react"

interface TaxNotificationsProps {
  userRole?: string
}

export function TaxNotifications({ userRole = "WAJIB_PAJAK" }: TaxNotificationsProps) {
  // Dummy data untuk demo
  const notifications = [
    {
      id: "NOTIF001",
      title: "Jatuh Tempo SPT PPN November 2024",
      message: "SPT PPN Masa Pajak November 2024 akan jatuh tempo dalam 3 hari",
      type: "REMINDER",
      isRead: false,
      createdAt: "2024-11-27T09:00:00",
      action: {
        type: "VIEW_REPORT",
        label: "Lihat SPT",
        reportId: "RPT001"
      }
    },
    {
      id: "NOTIF002",
      title: "Pembayaran Berhasil",
      message: "Pembayaran PPh Pasal 21 November 2024 sebesar Rp28.000.000 telah berhasil",
      type: "SUCCESS",
      isRead: true,
      createdAt: "2024-11-25T14:15:00",
      action: {
        type: "VIEW_RECEIPT",
        label: "Lihat Bukti",
        paymentId: "PAY002"
      }
    },
    {
      id: "NOTIF003",
      title: "SPT Terverifikasi",
      message: "SPT PPN Oktober 2024 Anda telah diverifikasi dan disetujui",
      type: "INFO",
      isRead: true,
      createdAt: "2024-11-20T11:30:00",
      action: {
        type: "VIEW_REPORT",
        label: "Lihat Detail",
        reportId: "RPT004"
      }
    },
    {
      id: "NOTIF004",
      title: "Update Regulasi Pajak",
      message: "Terjadi perubahan regulasi tarif PPN untuk tahun 2025",
      type: "WARNING",
      isRead: false,
      createdAt: "2024-11-15T08:00:00",
      action: {
        type: "VIEW_REGULATION",
        label: "Baca Selengkapnya",
        url: "/regulations/ppn-2025"
      }
    },
    {
      id: "NOTIF005",
      title: "Pembayaran Gagal",
      message: "Pembayaran PPh Pasal 25 Oktober 2024 gagal. Silakan coba lagi.",
      type: "ERROR",
      isRead: false,
      createdAt: "2024-11-10T16:45:00",
      action: {
        type: "RETRY_PAYMENT",
        label: "Coba Lagi",
        paymentId: "PAY005"
      }
    }
  ]

  const getNotificationIcon = (type: string) => {
    const iconConfig = {
      INFO: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
      SUCCESS: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
      WARNING: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
      ERROR: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
      REMINDER: { icon: Bell, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
    }

    const config = iconConfig[type as keyof typeof iconConfig] || iconConfig.INFO
    const Icon = config.icon

    return (
      <div className={`p-2 rounded-lg ${config.bg}`}>
        <Icon className={`h-5 w-5 ${config.color}`} />
      </div>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      INFO: { label: "Informasi", variant: "secondary" as const },
      SUCCESS: { label: "Berhasil", variant: "default" as const },
      WARNING: { label: "Peringatan", variant: "outline" as const },
      ERROR: { label: "Error", variant: "destructive" as const },
      REMINDER: { label: "Pengingat", variant: "outline" as const },
    }

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.INFO
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffDays > 0) {
      return `${diffDays} hari yang lalu`
    } else if (diffHours > 0) {
      return `${diffHours} jam yang lalu`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} menit yang lalu`
    } else {
      return "Baru saja"
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Notifikasi Pajak
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Update dan pengingat terkait administrasi pajak Anda
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Tandai semua dibaca
            </Button>
            <Button variant="outline" size="sm">
              Pengaturan
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      {notification.title}
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      )}
                    </h4>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(notification.type)}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {notification.type === "REMINDER" && (
                        <>
                          <Calendar className="h-3 w-3" />
                          <span>3 hari lagi</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.action && (
                        <Button size="sm" variant="outline">
                          {notification.action.label}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}