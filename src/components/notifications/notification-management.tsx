"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Calendar,
  FileText,
  CreditCard,
  MoreHorizontal,
  Search,
  Filter,
  Trash2,
  Mail,
  Smartphone,
  Settings,
  Clock,
  RefreshCw
} from "lucide-react"
import { fetchWithAuth } from '@/lib/auth-utils'

interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'REMINDER'
  isRead: boolean
  createdAt: string
}

interface NotificationSettings {
  emailNotifications: {
    sptDue: boolean
    paymentDue: boolean
    paymentSuccess: boolean
    paymentFailed: boolean
    reportVerified: boolean
    systemUpdates: boolean
  }
  pushNotifications: {
    sptDue: boolean
    paymentDue: boolean
    paymentSuccess: boolean
    paymentFailed: boolean
    reportVerified: boolean
    systemUpdates: boolean
  }
  reminderSettings: {
    sptReminderDays: number
    paymentReminderDays: number
    dailyDigest: boolean
    weeklyDigest: boolean
  }
}

interface Reminder {
  id: string
  type: 'REMINDER'
  title: string
  message: string
  dueDate?: Date
  daysUntilDue?: number
  priority: 'high' | 'medium' | 'low'
  category: 'spt' | 'payment'
  referenceId: string
}

export function NotificationManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [filter, setFilter] = useState({
    type: 'all',
    isRead: 'all'
  })

  useEffect(() => {
    fetchNotifications()
    fetchReminders()
    fetchSettings()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications')
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchReminders = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications/reminders')
      const data = await response.json()
      setReminders(data.reminders || [])
    } catch (error) {
      console.error('Error fetching reminders:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications/settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetchWithAuth(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: true })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length === 0) return

    try {
      await fetchWithAuth('/api/notifications/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'mark_read', notificationIds: unreadIds })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetchWithAuth(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const deleteSelected = async () => {
    if (selectedNotifications.length === 0) return

    try {
      await fetchWithAuth('/api/notifications/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'delete', notificationIds: selectedNotifications })
      })
      setSelectedNotifications([])
      fetchNotifications()
    } catch (error) {
      console.error('Error deleting selected notifications:', error)
    }
  }

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!settings) return

    try {
      const updatedSettings = { ...settings, ...newSettings }
      await fetchWithAuth('/api/notifications/settings', {
        method: 'PATCH',
        body: JSON.stringify(updatedSettings)
      })
      setSettings(updatedSettings)
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

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

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { label: "Tinggi", variant: "destructive" as const },
      medium: { label: "Sedang", variant: "outline" as const },
      low: { label: "Rendah", variant: "secondary" as const },
    }

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
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

  const filteredNotifications = notifications.filter(notification => {
    if (filter.type && notification.type !== filter.type) return false
    if (filter.isRead !== '' && notification.isRead.toString() !== filter.isRead) return false
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifikasi & Pengingat</h2>
          <p className="text-muted-foreground">
            Kelola notifikasi dan pengaturan pengingat pajak Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-6 px-3">
              {unreadCount} belum dibaca
            </Badge>
          )}
          <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
            Tandai semua dibaca
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="reminders">Pengingat</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Cari notifikasi..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filter.type} onValueChange={(value) => setFilter({ ...filter, type: value })}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="INFO">Informasi</SelectItem>
                    <SelectItem value="SUCCESS">Berhasil</SelectItem>
                    <SelectItem value="WARNING">Peringatan</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                    <SelectItem value="REMINDER">Pengingat</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filter.isRead} onValueChange={(value) => setFilter({ ...filter, isRead: value })}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="false">Belum Dibaca</SelectItem>
                    <SelectItem value="true">Sudah Dibaca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedNotifications.length} notifikasi dipilih
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        selectedNotifications.forEach(id => markAsRead(id))
                        setSelectedNotifications([])
                      }}
                    >
                      Tandai dibaca
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelected}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Notifikasi</CardTitle>
              <CardDescription>
                Semua notifikasi terkait aktivitas pajak Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Tidak ada notifikasi</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                        !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNotifications([...selectedNotifications, notification.id])
                            } else {
                              setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id))
                            }
                          }}
                          className="mt-1"
                        />
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
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Tandai dibaca
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Pengingat SPT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reminders.filter(r => r.category === 'spt').length}
                </div>
                <p className="text-sm text-muted-foreground">
                  SPT yang perlu diperhatikan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Pengingat Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reminders.filter(r => r.category === 'payment').length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Pembayaran yang tertunda
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Prioritas Tinggi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reminders.filter(r => r.priority === 'high').length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Membutuhkan perhatian segera
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengingat</CardTitle>
              <CardDescription>
                Pengingat otomatis untuk jadwal pajak Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reminders.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Tidak ada pengingat aktif</p>
                  </div>
                ) : (
                  reminders.map((reminder) => (
                    <div 
                      key={reminder.id} 
                      className={`p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                        reminder.priority === 'high' ? 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(reminder.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{reminder.title}</h4>
                            <div className="flex items-center gap-2">
                              {getPriorityBadge(reminder.priority)}
                              <Badge variant="outline">
                                {reminder.category === 'spt' ? 'SPT' : 'Pembayaran'}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {reminder.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {reminder.daysUntilDue !== undefined && (
                                <>
                                  <Calendar className="h-3 w-3" />
                                  <span>{reminder.daysUntilDue} hari lagi</span>
                                </>
                              )}
                            </div>
                            <Button size="sm" variant="outline">
                              Lihat Detail
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {settings && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Notifikasi Email
                  </CardTitle>
                  <CardDescription>
                    Atur notifikasi yang akan dikirimkan melalui email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings?.emailNotifications && Object.entries(settings.emailNotifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={`email-${key}`} className="text-sm font-medium">
                          {getNotificationLabel(key)}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {getNotificationDescription(key)}
                        </p>
                      </div>
                      <Switch
                        id={`email-${key}`}
                        checked={value}
                        onCheckedChange={(checked) => {
                          updateSettings({
                            emailNotifications: {
                              ...settings.emailNotifications,
                              [key]: checked
                            }
                          })
                        }}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Notifikasi Push
                  </CardTitle>
                  <CardDescription>
                    Atur notifikasi yang akan muncul di aplikasi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings?.pushNotifications && Object.entries(settings.pushNotifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={`push-${key}`} className="text-sm font-medium">
                          {getNotificationLabel(key)}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {getNotificationDescription(key)}
                        </p>
                      </div>
                      <Switch
                        id={`push-${key}`}
                        checked={value}
                        onCheckedChange={(checked) => {
                          updateSettings({
                            pushNotifications: {
                              ...settings.pushNotifications,
                              [key]: checked
                            }
                          })
                        }}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Pengaturan Pengingat
                  </CardTitle>
                  <CardDescription>
                    Atur jadwal dan frekuensi pengingat otomatis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="spt-reminder-days" className="text-sm font-medium">
                        Pengingat SPT (hari sebelum jatuh tempo)
                      </Label>
                      <Input
                        id="spt-reminder-days"
                        type="number"
                        value={settings.reminderSettings.sptReminderDays}
                        onChange={(e) => {
                          updateSettings({
                            reminderSettings: {
                              ...settings.reminderSettings,
                              sptReminderDays: parseInt(e.target.value) || 3
                            }
                          })
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment-reminder-days" className="text-sm font-medium">
                        Pengingat Pembayaran (hari sebelum jatuh tempo)
                      </Label>
                      <Input
                        id="payment-reminder-days"
                        type="number"
                        value={settings.reminderSettings.paymentReminderDays}
                        onChange={(e) => {
                          updateSettings({
                            reminderSettings: {
                              ...settings.reminderSettings,
                              paymentReminderDays: parseInt(e.target.value) || 2
                            }
                          })
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="daily-digest" className="text-sm font-medium">
                          Ringkasan Harian
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Terima ringkasan notifikasi setiap hari
                        </p>
                      </div>
                      <Switch
                        id="daily-digest"
                        checked={settings.reminderSettings.dailyDigest}
                        onCheckedChange={(checked) => {
                          updateSettings({
                            reminderSettings: {
                              ...settings.reminderSettings,
                              dailyDigest: checked
                            }
                          })
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weekly-digest" className="text-sm font-medium">
                          Ringkasan Mingguan
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Terima ringkasan notifikasi setiap minggu
                        </p>
                      </div>
                      <Switch
                        id="weekly-digest"
                        checked={settings.reminderSettings.weeklyDigest}
                        onCheckedChange={(checked) => {
                          updateSettings({
                            reminderSettings: {
                              ...settings.reminderSettings,
                              weeklyDigest: checked
                            }
                          })
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getNotificationLabel(key: string): string {
  const labels: Record<string, string> = {
    sptDue: 'Jatuh Tempo SPT',
    paymentDue: 'Jatuh Tempo Pembayaran',
    paymentSuccess: 'Pembayaran Berhasil',
    paymentFailed: 'Pembayaran Gagal',
    reportVerified: 'Laporan Terverifikasi',
    systemUpdates: 'Update Sistem'
  }
  return labels[key] || key
}

function getNotificationDescription(key: string): string {
  const descriptions: Record<string, string> = {
    sptDue: 'Notifikasi ketika SPT akan jatuh tempo',
    paymentDue: 'Notifikasi ketika pembayaran akan jatuh tempo',
    paymentSuccess: 'Konfirmasi ketika pembayaran berhasil',
    paymentFailed: 'Peringatan ketika pembayaran gagal',
    reportVerified: 'Pemberitahuan ketika laporan telah diverifikasi',
    systemUpdates: 'Informasi tentang update dan maintenance sistem'
  }
  return descriptions[key] || ''
}