"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { 
  CalendarIcon, 
  Download, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  FileText,
  Filter,
  RefreshCw,
  Eye,
  Printer
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface ReportData {
  id: string
  title: string
  type: string
  period: string
  generatedDate: string
  status: "generated" | "processing" | "failed"
  size: string
  format: string
}

interface TaxSummary {
  period: string
  totalSPT: number
  totalPayment: number
  complianceRate: number
  overdueCount: number
}

interface TaxTrend {
  month: string
  sptCount: number
  paymentAmount: number
  compliance: number
}

export function ReportsAnalytics({ userRole }: { userRole?: string }) {
  const [reportData, setReportData] = useState<ReportData[]>([
    {
      id: "1",
      title: "Laporan Pajak Bulanan - Januari 2024",
      type: "Bulanan",
      period: "Januari 2024",
      generatedDate: "2024-02-01",
      status: "generated",
      size: "2.5 MB",
      format: "PDF"
    },
    {
      id: "2",
      title: "Laporan Kepatuhan Pajak - Q1 2024",
      type: "Kuartalan",
      period: "Q1 2024",
      generatedDate: "2024-04-01",
      status: "processing",
      size: "-",
      format: "Excel"
    },
    {
      id: "3",
      title: "Laporan Tahunan PPh - 2023",
      type: "Tahunan",
      period: "2023",
      generatedDate: "2024-01-15",
      status: "generated",
      size: "5.8 MB",
      format: "PDF"
    },
    {
      id: "4",
      title: "Analisis Trend Pembayaran - 2024",
      type: "Analitik",
      period: "2024",
      generatedDate: "2024-03-20",
      status: "generated",
      size: "3.2 MB",
      format: "PDF"
    },
    {
      id: "5",
      title: "Laporan Audit Internal - Februari 2024",
      type: "Audit",
      period: "Februari 2024",
      generatedDate: "2024-02-28",
      status: "failed",
      size: "-",
      format: "PDF"
    }
  ])

  const [taxSummary, setTaxSummary] = useState<TaxSummary[]>([
    { period: "Januari 2024", totalSPT: 15, totalPayment: 125000000, complianceRate: 93, overdueCount: 1 },
    { period: "Februari 2024", totalSPT: 18, totalPayment: 145000000, complianceRate: 89, overdueCount: 2 },
    { period: "Maret 2024", totalSPT: 12, totalPayment: 98000000, complianceRate: 100, overdueCount: 0 },
    { period: "Q1 2024", totalSPT: 45, totalPayment: 368000000, complianceRate: 94, overdueCount: 3 }
  ])

  const [taxTrends, setTaxTrends] = useState<TaxTrend[]>([
    { month: "Okt 2023", sptCount: 12, paymentAmount: 95000000, compliance: 85 },
    { month: "Nov 2023", sptCount: 14, paymentAmount: 110000000, compliance: 88 },
    { month: "Des 2023", sptCount: 16, paymentAmount: 130000000, compliance: 92 },
    { month: "Jan 2024", sptCount: 15, paymentAmount: 125000000, compliance: 93 },
    { month: "Feb 2024", sptCount: 18, paymentAmount: 145000000, compliance: 89 },
    { month: "Mar 2024", sptCount: 12, paymentAmount: 98000000, compliance: 100 }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterPeriod, setFilterPeriod] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null)

  const filteredReports = reportData.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || report.type === filterType
    const matchesPeriod = filterPeriod === "all" || report.period.includes(filterPeriod)
    
    return matchesSearch && matchesType && matchesPeriod
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      generated: { label: "Terbuat", variant: "default" as const },
      processing: { label: "Diproses", variant: "secondary" as const },
      failed: { label: "Gagal", variant: "destructive" as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.generated
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

  const getOverallStats = () => {
    const totalSPT = taxSummary.reduce((sum, item) => sum + item.totalSPT, 0)
    const totalPayment = taxSummary.reduce((sum, item) => sum + item.totalPayment, 0)
    const avgCompliance = taxSummary.reduce((sum, item) => sum + item.complianceRate, 0) / taxSummary.length
    const totalOverdue = taxSummary.reduce((sum, item) => sum + item.overdueCount, 0)
    
    return { totalSPT, totalPayment, avgCompliance, totalOverdue }
  }

  const stats = getOverallStats()

  const reportTypes = [
    { value: "Bulanan", label: "Laporan Bulanan" },
    { value: "Kuartalan", label: "Laporan Kuartalan" },
    { value: "Tahunan", label: "Laporan Tahunan" },
    { value: "Analitik", label: "Analitik" },
    { value: "Audit", label: "Audit" }
  ]

  const periods = [
    { value: "2024", label: "2024" },
    { value: "2023", label: "2023" },
    { value: "Q1", label: "Q1" },
    { value: "Q2", label: "Q2" },
    { value: "Q3", label: "Q3" },
    { value: "Q4", label: "Q4" }
  ]

  const handleGenerateReport = (type: string, period: string) => {
    const newReport: ReportData = {
      id: (reportData.length + 1).toString(),
      title: `Laporan ${type} - ${period}`,
      type: type,
      period: period,
      generatedDate: new Date().toISOString().split('T')[0],
      status: "processing",
      size: "-",
      format: "PDF"
    }
    
    setReportData([newReport, ...reportData])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Laporan & Analitik</h3>
          <p className="text-slate-600 dark:text-slate-300">Analisis komprehensif kinerja kepatuhan pajak</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleGenerateReport("Bulanan", "April 2024")}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Laporan
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SPT</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSPT}</div>
            <p className="text-xs text-muted-foreground">
              Semua periode
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pembayaran</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPayment)}</div>
            <p className="text-xs text-muted-foreground">
              Nilai total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Kepatuhan</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.avgCompliance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Terlambat</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalOverdue}</div>
            <p className="text-xs text-muted-foreground">
              Butuh perhatian
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="trends">Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Tax Summary Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pajak</CardTitle>
              <CardDescription>
                Overview performa pajak per periode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periode</TableHead>
                      <TableHead className="text-right">Total SPT</TableHead>
                      <TableHead className="text-right">Total Pembayaran</TableHead>
                      <TableHead className="text-right">Kepatuhan</TableHead>
                      <TableHead className="text-right">Terlambat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxSummary.map((summary, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{summary.period}</TableCell>
                        <TableCell className="text-right">{summary.totalSPT}</TableCell>
                        <TableCell className="text-right">{formatCurrency(summary.totalPayment)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={summary.complianceRate} className="w-16" />
                            <span className="text-sm">{summary.complianceRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {summary.overdueCount > 0 ? (
                            <Badge variant="destructive">{summary.overdueCount}</Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleGenerateReport("Bulanan", "April 2024")}>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Laporan Bulanan
                </CardTitle>
                <CardDescription>
                  Generate laporan pajak bulanan terbaru
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleGenerateReport("Kuartalan", "Q2 2024")}>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <PieChart className="h-5 w-5 mr-2 text-green-600" />
                  Laporan Kuartalan
                </CardTitle>
                <CardDescription>
                  Analisis kinerja kuartal pajak
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleGenerateReport("Analitik", "2024")}>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Analitik Mendalam
                </CardTitle>
                <CardDescription>
                  Analisis trend dan prediksi
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
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
                      placeholder="Cari laporan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    {reportTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {periods.map(period => (
                      <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Tanggal
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{
                          from: dateRange.from,
                          to: dateRange.to
                        }}
                        onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Laporan</CardTitle>
              <CardDescription>
                Laporan pajak yang telah dibuat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Judul Laporan</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Dibuat Tanggal</TableHead>
                      <TableHead>Ukuran</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>{report.type}</TableCell>
                        <TableCell>{report.period}</TableCell>
                        <TableCell>{formatDate(report.generatedDate)}</TableCell>
                        <TableCell>{report.size}</TableCell>
                        <TableCell>{report.format}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {report.status === "generated" && (
                              <>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </>
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
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Analisis Kepatuhan</CardTitle>
                <CardDescription>
                  Tingkat kepatuhan pajak per periode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taxSummary.map((summary, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{summary.period}</span>
                        <span>{summary.complianceRate}%</span>
                      </div>
                      <Progress value={summary.complianceRate} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Pembayaran</CardTitle>
                <CardDescription>
                  Perbandingan pembayaran per periode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taxSummary.map((summary, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{summary.period}</span>
                        <span>{formatCurrency(summary.totalPayment)}</span>
                      </div>
                      <Progress 
                        value={(summary.totalPayment / Math.max(...taxSummary.map(s => s.totalPayment))) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Metrik Kinerja</CardTitle>
              <CardDescription>
                Indikator kinerja utama pajak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {stats.avgCompliance.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Tingkat Kepatuhan Rata-rata</div>
                  <div className="text-xs text-green-600 mt-1">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +2.5% dari periode lalu
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatCurrency(stats.totalPayment)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Pembayaran</div>
                  <div className="text-xs text-green-600 mt-1">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +15.3% dari periode lalu
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {stats.totalOverdue}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Terlambat</div>
                  <div className="text-xs text-red-600 mt-1">
                    <TrendingDown className="h-3 w-3 inline mr-1" />
                    -40% dari periode lalu
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Analitik</CardTitle>
              <CardDescription>
                Analisis trend SPT dan pembayaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Trend Jumlah SPT</h4>
                  <div className="space-y-3">
                    {taxTrends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm w-24">{trend.month}</span>
                        <div className="flex-1 mx-4">
                          <Progress 
                            value={(trend.sptCount / Math.max(...taxTrends.map(t => t.sptCount))) * 100} 
                            className="h-2" 
                          />
                        </div>
                        <span className="text-sm w-12 text-right">{trend.sptCount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Trend Pembayaran</h4>
                  <div className="space-y-3">
                    {taxTrends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm w-24">{trend.month}</span>
                        <div className="flex-1 mx-4">
                          <Progress 
                            value={(trend.paymentAmount / Math.max(...taxTrends.map(t => t.paymentAmount))) * 100} 
                            className="h-2" 
                          />
                        </div>
                        <span className="text-sm w-20 text-right">{formatCurrency(trend.paymentAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Trend Kepatuhan</h4>
                  <div className="space-y-3">
                    {taxTrends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm w-24">{trend.month}</span>
                        <div className="flex-1 mx-4">
                          <Progress value={trend.compliance} className="h-2" />
                        </div>
                        <span className="text-sm w-12 text-right">{trend.compliance}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Detail Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Laporan</DialogTitle>
              <DialogDescription>
                Informasi lengkap laporan pajak
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Judul Laporan</p>
                  <p className="text-sm">{selectedReport.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Jenis Laporan</p>
                  <p className="text-sm">{selectedReport.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Periode</p>
                  <p className="text-sm">{selectedReport.period}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Status</p>
                  <p className="text-sm">{getStatusBadge(selectedReport.status)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Dibuat Tanggal</p>
                  <p className="text-sm">{formatDate(selectedReport.generatedDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Format</p>
                  <p className="text-sm">{selectedReport.format}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Ukuran File</p>
                  <p className="text-sm">{selectedReport.size}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  Tutup
                </Button>
                {selectedReport.status === "generated" && (
                  <>
                    <Button variant="outline">
                      <Printer className="h-4 w-4 mr-2" />
                      Cetak
                    </Button>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}