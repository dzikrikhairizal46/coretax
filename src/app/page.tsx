"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Building2, 
  Calculator, 
  FileText, 
  BarChart3, 
  Users, 
  Bell, 
  Settings, 
  Download, 
  Upload,
  LogOut,
  User,
  Shield,
  Briefcase,
  MessageSquare,
  CheckCircle
} from "lucide-react"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { TaxOverview } from "@/components/dashboard/tax-overview"
import { RecentReports } from "@/components/dashboard/recent-reports"
import { RecentPayments } from "@/components/dashboard/recent-payments"
import { TaxNotifications } from "@/components/dashboard/tax-notifications"
import { SPTManagement } from "@/components/spt/spt-management"
import { PaymentManagement } from "@/components/payment/payment-management"
import { ReportsAnalytics } from "@/components/reports/reports-analytics"
import { NotificationManagement } from "@/components/notifications/notification-management"
import { ProfileManagement } from "@/components/profiles/profile-management"
import { DocumentManagement } from "@/components/documents/document-management"
import { ConsultationManagement } from "@/components/consultations/consultation-management"
import { TaxCalculator } from "@/components/tax-calculations/tax-calculator"
import { BankIntegration } from "@/components/bank-integrations/bank-integration"
import SimpleMonitoring from "@/components/monitoring/SimpleMonitoring"
import { AuditComplianceManagement } from "@/components/audit-compliance/audit-compliance-management"
import { useRouter } from "next/navigation"

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview")
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const phasesPerPage = 6
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("coretax-user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("coretax-user")
      }
    }
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("coretax-user")
    setUser(null)
  }

  const handleLogin = () => {
    router.push("/auth")
  }

  // Phase definitions - completed phases (1-14)
  const allPhases = [
    { number: 1, name: "Struktur Dasar", status: "Selesai", color: "green" },
    { number: 2, name: "Autentikasi & Manajemen Pengguna", status: "Selesai", color: "green" },
    { number: 3, name: "Dashboard Utama dengan Widget Pajak", status: "Selesai", color: "green" },
    { number: 4, name: "Manajemen SPT", status: "Selesai", color: "green" },
    { number: 5, name: "Modul Pembayaran Pajak", status: "Selesai", color: "green" },
    { number: 6, name: "Modul Laporan dan Analitik", status: "Selesai", color: "green" },
    { number: 7, name: "Sistem Notifikasi dan Reminder", status: "Selesai", color: "green" },
    { number: 8, name: "Manajemen Profil Perusahaan/Wajib Pajak", status: "Selesai", color: "green" },
    { number: 9, name: "Modul Dokumen dan Arsip", status: "Selesai", color: "green" },
    { number: 10, name: "Modul Konsultasi Pajak", status: "Selesai", color: "green" },
    { number: 11, name: "Modul Kalkulator Pajak", status: "Selesai", color: "green" },
    { number: 12, name: "Integrasi Perbankan", status: "Selesai", color: "green" },
    { number: 13, name: "Modul Audit dan Compliance", status: "Selesai", color: "green" },
    { number: 14, name: "Optimasi dan Finalisasi Sistem", status: "Selesai", color: "green" }
  ]

  // Pagination logic
  const indexOfLastPhase = currentPage * phasesPerPage
  const indexOfFirstPhase = indexOfLastPhase - phasesPerPage
  const currentPhases = allPhases.slice(indexOfFirstPhase, indexOfLastPhase)
  const totalPages = Math.ceil(allPhases.length / phasesPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const handleDownloadBackup = async (fase: number) => {
    try {
      const response = await fetch(`/api/backup/${fase}`)
      if (!response.ok) {
        throw new Error(`Failed to download backup for Fase ${fase}`)
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `coretax-fase-${fase}-backup.tar.gz`
        : `coretax-fase-${fase}-backup.tar.gz`
      
      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading backup:', error)
      alert(`Gagal mengunduh backup untuk Fase ${fase}. File mungkin tidak tersedia.`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">CoreTax-ID</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sistem Administrasi Pajak Modern</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">Fase 14</Badge>
                <Button onClick={handleLogin}>
                  <User className="h-4 w-4 mr-2" />
                  Masuk
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Selamat Datang di CoreTax-ID
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-6">
              Sistem administrasi pajak terintegrasi untuk kemudahan pengelolaan kepatuhan pajak Anda
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" onClick={handleLogin} className="text-lg px-8 py-3">
                Mulai Sekarang
                <Building2 className="ml-2 h-5 w-5" />
              </Button>
              <div className="text-sm text-slate-500">
                Atau coba akun demo gratis
              </div>
            </div>
          </div>

          {/* Demo Users Section */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                Coba Akun Demo
              </CardTitle>
              <CardDescription>
                Gunakan akun demo berikut untuk mencoba sistem tanpa perlu registrasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer" onClick={handleLogin}>
                  <Shield className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <h4 className="font-medium">Administrator</h4>
                  <p className="text-sm text-muted-foreground">admin@coretax.id</p>
                  <p className="text-xs text-muted-foreground">Password: admin123</p>
                </div>
                <div className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer" onClick={handleLogin}>
                  <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">Budi Santoso</h4>
                  <p className="text-sm text-muted-foreground">wajibpajak1@coretax.id</p>
                  <p className="text-xs text-muted-foreground">Password: wajib123</p>
                </div>
                <div className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer" onClick={handleLogin}>
                  <Building2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">Siti Rahayu</h4>
                  <p className="text-sm text-muted-foreground">wajibpajak2@coretax.id</p>
                  <p className="text-xs text-muted-foreground">Password: wajib123</p>
                </div>
                <div className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer" onClick={handleLogin}>
                  <Briefcase className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium">Ahmad Wijaya</h4>
                  <p className="text-sm text-muted-foreground">petugas@coretax.id</p>
                  <p className="text-xs text-muted-foreground">Password: petugas123</p>
                </div>
                <div className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer" onClick={handleLogin}>
                  <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h4 className="font-medium">Dewi Lestari</h4>
                  <p className="text-sm text-muted-foreground">konsultan@coretax.id</p>
                  <p className="text-xs text-muted-foreground">Password: konsultan123</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Klik pada kartu di atas atau masuk ke halaman auth untuk menggunakan akun demo
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Manajemen SPT
                </CardTitle>
                <CardDescription>
                  Pengelolaan Surat Pemberitahuan Pajak lengkap dengan validasi otomatis
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-green-600" />
                  Kalkulator Pajak
                </CardTitle>
                <CardDescription>
                  Perhitungan pajak otomatis untuk berbagai jenis pajak
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Laporan & Analitik
                </CardTitle>
                <CardDescription>
                  Dashboard komprehensif untuk analisis kepatuhan pajak
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Progress Pengembangan</CardTitle>
              <CardDescription>
                Status pengembangan sistem CoreTax-ID dalam 14 fase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentPhases.map((phase) => (
                  <div key={phase.number} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 bg-${phase.color}-500 rounded-full`}></div>
                      <span className="font-medium">Fase {phase.number}: {phase.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{phase.status}</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(phase.number)}>
                        <Download className="h-4 w-4 mr-2" />
                        Backup
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <Button
                          key={number}
                          variant={currentPage === number ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(number)}
                          className="w-10 h-10"
                        >
                          {number}
                        </Button>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
                
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {currentPhases.length} dari {allPhases.length} fase total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">CoreTax-ID</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Sistem Administrasi Pajak Modern</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Fase 14</Badge>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Selamat Datang kembali, {user.name}!
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Kelola administrasi pajak Anda dengan mudah dan efisien
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-13">
            <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="spt">SPT</TabsTrigger>
            <TabsTrigger value="payment">Pembayaran</TabsTrigger>
            <TabsTrigger value="reports">Laporan</TabsTrigger>
            <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
            <TabsTrigger value="profiles">Profil</TabsTrigger>
            <TabsTrigger value="documents">Dokumen</TabsTrigger>
            <TabsTrigger value="consultations">Konsultasi</TabsTrigger>
            <TabsTrigger value="calculator">Kalkulator</TabsTrigger>
            <TabsTrigger value="bank">Bank</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="modules">Modul</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardStats userRole={user?.role} userId={user?.id} />
            <Card>
              <CardHeader>
                <CardTitle>Informasi Akun</CardTitle>
                <CardDescription>
                  Detail informasi akun Anda di sistem CoreTax-ID
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Email</p>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  {user.npwp && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">NPWP</p>
                      <p className="text-sm">{user.npwp}</p>
                    </div>
                  )}
                  {user.company && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">Perusahaan</p>
                      <p className="text-sm">{user.company}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-500">Role</p>
                    <p className="text-sm">{user.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardStats userRole={user?.role} userId={user?.id} />
            <TaxOverview userRole={user?.role} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentReports userRole={user?.role} />
              <RecentPayments userRole={user?.role} />
            </div>
            <TaxNotifications userRole={user?.role} />
          </TabsContent>

          <TabsContent value="spt" className="space-y-6">
            <SPTManagement userRole={user?.role} />
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <PaymentManagement userRole={user?.role} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsAnalytics userRole={user?.role} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationManagement />
          </TabsContent>

          <TabsContent value="profiles" className="space-y-6">
            <ProfileManagement userRole={user?.role} />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <DocumentManagement />
          </TabsContent>

          <TabsContent value="consultations" className="space-y-6">
            <ConsultationManagement userRole={user?.role} />
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <TaxCalculator userRole={user?.role} />
          </TabsContent>

          <TabsContent value="bank" className="space-y-6">
            <BankIntegration userRole={user?.role} />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditComplianceManagement userRole={user?.role} />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <SimpleMonitoring />
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Modul Inti</CardTitle>
                  <CardDescription>Fitur utama sistem administrasi pajak</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">Autentikasi & Keamanan</span>
                    <Badge variant="secondary">Fase 2 ✓</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">Dashboard Utama</span>
                    <Badge variant="secondary">Fase 3 ✓</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">Manajemen SPT</span>
                    <Badge variant="secondary">Fase 4 ✓</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">Sistem Pembayaran</span>
                    <Badge variant="secondary">Fase 5 ✓</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Modul Pendukung</CardTitle>
                  <CardDescription>Fitur tambahan untuk kelengkapan sistem</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">Laporan & Analitik</span>
                    <Badge variant="secondary">Fase 6 ✓</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">Notifikasi & Pengingat</span>
                    <Badge variant="secondary">Fase 7 ✓</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">Profil Wajib Pajak</span>
                    <Badge variant="secondary">Fase 8 ✓</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">Manajemen Dokumen</span>
                    <Badge variant="secondary">Fase 9 ✓</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-800 rounded-lg">
                    <span className="font-medium text-blue-900 dark:text-blue-100">Integrasi Bank</span>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">Fase 13</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Pengembangan</CardTitle>
                <CardDescription>
                  Status pengembangan sistem CoreTax-ID dalam 14 fase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Fase 1: Struktur Dasar</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Selesai</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(1)}>
                        <Download className="h-4 w-4 mr-2" />
                        Backup
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Fase 2: Autentikasi & Manajemen Pengguna</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Selesai</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(2)}>
                        <Download className="h-4 w-4 mr-2" />
                        Backup
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Fase 3: Dashboard Utama dengan Widget Pajak</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Selesai</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(3)}>
                        <Download className="h-4 w-4 mr-2" />
                        Backup
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Fase 4: Manajemen SPT</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Selesai</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(4)}>
                        <Download className="h-4 w-4 mr-2" />
                        Backup
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Fase 5: Modul Pembayaran Pajak</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Selesai</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(5)}>
                        <Download className="h-4 w-4 mr-2" />
                        Backup
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Fase 6: Modul Laporan dan Analitik</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Selesai</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(6)}>
                        <Download className="h-4 w-4 mr-2" />
                        Backup
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Fase 7: Sistem Notifikasi dan Reminder</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Selesai</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(7)}>
                        <Download className="h-4 w-4 mr-2" />
                        Backup
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Fase 8: Manajemen Profil Perusahaan/Wajib Pajak</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Selesai</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(8)}>
                        <Download className="h-4 w-4 mr-2" />
                        Backup
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Fase 9: Modul Dokumen dan Arsip</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Selesai</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(9)}>
                        <Download className="h-4 w-4 mr-2" />
                        Backup
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-blue-900">Fase 13: Modul Audit dan Compliance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Selesai</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(13)}>
                        <Download className="h-4 w-4 mr-2" />
                        Backup
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-900">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">Fase 14: Optimasi dan Finalisasi Sistem</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">Selesai</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(14)}>
                        <Download className="h-4 w-4 mr-2" />
                        Backup
                      </Button>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      1 fase lagi akan dikembangkan secara bertahap
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}