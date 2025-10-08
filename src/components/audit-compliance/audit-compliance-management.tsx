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
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Target,
  TrendingUp,
  Award,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

interface Audit {
  id: string
  userId: string
  title: string
  description: string
  auditType: string
  scope: string
  status: string
  startDate?: string
  endDate?: string
  auditorId?: string
  findings: number
  recommendations: number
  riskLevel: string
  complianceScore?: number
  reportUrl?: string
  notes?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name?: string
    email: string
    role: string
  }
  auditor?: {
    id: string
    name?: string
    email: string
    role: string
  }
  auditItems: AuditItem[]
}

interface AuditItem {
  id: string
  auditId: string
  category: string
  title: string
  description: string
  severity: string
  status: string
  finding?: string
  recommendation?: string
  evidence?: string
  dueDate?: string
  resolvedAt?: string
  resolvedBy?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface ComplianceRecord {
  id: string
  userId: string
  regulationType: string
  regulationId: string
  title: string
  description: string
  requirement: string
  status: string
  evidence?: string
  lastVerified?: string
  nextReview?: string
  assignedTo?: string
  priority: string
  riskLevel: string
  complianceScore?: number
  actionPlan?: string
  implementationDate?: string
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

const auditFormSchema = z.object({
  title: z.string().min(1, "Judul audit harus diisi"),
  description: z.string().min(1, "Deskripsi audit harus diisi"),
  auditType: z.string().min(1, "Tipe audit harus dipilih"),
  scope: z.string().min(1, "Scope audit harus dipilih"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  auditorId: z.string().optional(),
  riskLevel: z.string().default("LOW"),
  notes: z.string().optional()
})

const complianceFormSchema = z.object({
  regulationType: z.string().min(1, "Tipe regulasi harus dipilih"),
  regulationId: z.string().min(1, "ID regulasi harus diisi"),
  title: z.string().min(1, "Judul harus diisi"),
  description: z.string().min(1, "Deskripsi harus diisi"),
  requirement: z.string().min(1, "Persyaratan harus diisi"),
  status: z.string().default("NOT_COMPLIANT"),
  evidence: z.string().optional(),
  lastVerified: z.string().optional(),
  nextReview: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z.string().default("MEDIUM"),
  riskLevel: z.string().default("LOW"),
  complianceScore: z.number().min(0).max(100).optional(),
  actionPlan: z.string().optional(),
  implementationDate: z.string().optional(),
  notes: z.string().optional()
})

type AuditFormData = z.infer<typeof auditFormSchema>
type ComplianceFormData = z.infer<typeof complianceFormSchema>

export function AuditComplianceManagement({ userRole }: { userRole?: string }) {
  const [audits, setAudits] = useState<Audit[]>([])
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterRisk, setFilterRisk] = useState("")
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false)
  const [isComplianceDialogOpen, setIsComplianceDialogOpen] = useState(false)
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null)
  const [editingCompliance, setEditingCompliance] = useState<ComplianceRecord | null>(null)
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null)
  const [activeTab, setActiveTab] = useState("audits")

  const auditForm = useForm<AuditFormData>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      title: "",
      description: "",
      auditType: "",
      scope: "",
      startDate: "",
      endDate: "",
      auditorId: "",
      riskLevel: "LOW",
      notes: ""
    }
  })

  const complianceForm = useForm<ComplianceFormData>({
    resolver: zodResolver(complianceFormSchema),
    defaultValues: {
      regulationType: "",
      regulationId: "",
      title: "",
      description: "",
      requirement: "",
      status: "NOT_COMPLIANT",
      evidence: "",
      lastVerified: "",
      nextReview: "",
      assignedTo: "",
      priority: "MEDIUM",
      riskLevel: "LOW",
      complianceScore: undefined,
      actionPlan: "",
      implementationDate: "",
      notes: ""
    }
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      await Promise.all([fetchAudits(), fetchComplianceRecords()])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAudits = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType) params.append('auditType', filterType)
      if (filterStatus) params.append('status', filterStatus)
      if (filterRisk) params.append('riskLevel', filterRisk)

      const response = await fetch(`/api/audits?${params}`)
      const data = await response.json()
      setAudits(data.audits || [])
    } catch (error) {
      console.error('Error fetching audits:', error)
    }
  }

  const fetchComplianceRecords = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType) params.append('regulationType', filterType)
      if (filterStatus) params.append('status', filterStatus)
      if (filterRisk) params.append('riskLevel', filterRisk)

      const response = await fetch(`/api/compliance-records?${params}`)
      const data = await response.json()
      setComplianceRecords(data.complianceRecords || [])
    } catch (error) {
      console.error('Error fetching compliance records:', error)
    }
  }

  const handleCreateAudit = async (data: AuditFormData) => {
    try {
      const response = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchAudits()
        setIsAuditDialogOpen(false)
        auditForm.reset()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal membuat audit')
      }
    } catch (error) {
      console.error('Error creating audit:', error)
      alert('Gagal membuat audit')
    }
  }

  const handleUpdateAudit = async (data: AuditFormData) => {
    if (!editingAudit) return

    try {
      const response = await fetch(`/api/audits/${editingAudit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchAudits()
        setIsAuditDialogOpen(false)
        setEditingAudit(null)
        auditForm.reset()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal update audit')
      }
    } catch (error) {
      console.error('Error updating audit:', error)
      alert('Gagal update audit')
    }
  }

  const handleDeleteAudit = async (auditId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus audit ini?')) return

    try {
      const response = await fetch(`/api/audits/${auditId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchAudits()
      } else {
        alert('Gagal menghapus audit')
      }
    } catch (error) {
      console.error('Error deleting audit:', error)
      alert('Gagal menghapus audit')
    }
  }

  const handleCreateCompliance = async (data: ComplianceFormData) => {
    try {
      const response = await fetch('/api/compliance-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchComplianceRecords()
        setIsComplianceDialogOpen(false)
        complianceForm.reset()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal membuat compliance record')
      }
    } catch (error) {
      console.error('Error creating compliance record:', error)
      alert('Gagal membuat compliance record')
    }
  }

  const getAuditStatusBadge = (status: string) => {
    const statusConfig = {
      PLANNED: { label: "Direncanakan", variant: "secondary" as const, icon: Clock },
      IN_PROGRESS: { label: "Sedang Berjalan", variant: "default" as const, icon: Target },
      COMPLETED: { label: "Selesai", variant: "default" as const, icon: CheckCircle },
      CANCELLED: { label: "Dibatalkan", variant: "outline" as const, icon: AlertCircle },
      ON_HOLD: { label: "Ditahan", variant: "outline" as const, icon: Clock }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PLANNED
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getComplianceStatusBadge = (status: string) => {
    const statusConfig = {
      COMPLIANT: { label: "Compliant", variant: "default" as const, icon: CheckCircle },
      NOT_COMPLIANT: { label: "Tidak Compliant", variant: "destructive" as const, icon: AlertTriangle },
      PARTIALLY_COMPLIANT: { label: "Sebagian Compliant", variant: "outline" as const, icon: AlertCircle },
      UNDER_REVIEW: { label: "Dalam Review", variant: "secondary" as const, icon: Clock },
      EXEMPTED: { label: "Dikecualikan", variant: "outline" as const, icon: Award }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.NOT_COMPLIANT
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getRiskBadge = (riskLevel: string) => {
    const riskConfig = {
      LOW: { label: "Rendah", variant: "secondary" as const, color: "text-green-600" },
      MEDIUM: { label: "Sedang", variant: "outline" as const, color: "text-yellow-600" },
      HIGH: { label: "Tinggi", variant: "default" as const, color: "text-orange-600" },
      CRITICAL: { label: "Kritis", variant: "destructive" as const, color: "text-red-600" }
    }

    const config = riskConfig[riskLevel as keyof typeof riskConfig] || riskConfig.LOW
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getAuditStats = () => {
    const total = audits.length
    const planned = audits.filter(a => a.status === 'PLANNED').length
    const inProgress = audits.filter(a => a.status === 'IN_PROGRESS').length
    const completed = audits.filter(a => a.status === 'COMPLETED').length
    const avgComplianceScore = audits.reduce((sum, a) => sum + (a.complianceScore || 0), 0) / total || 0
    
    return { total, planned, inProgress, completed, avgComplianceScore }
  }

  const getComplianceStats = () => {
    const total = complianceRecords.length
    const compliant = complianceRecords.filter(c => c.status === 'COMPLIANT').length
    const notCompliant = complianceRecords.filter(c => c.status === 'NOT_COMPLIANT').length
    const partiallyCompliant = complianceRecords.filter(c => c.status === 'PARTIALLY_COMPLIANT').length
    const underReview = complianceRecords.filter(c => c.status === 'UNDER_REVIEW').length
    
    return { total, compliant, notCompliant, partiallyCompliant, underReview }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: id })
  }

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = !searchTerm || 
      audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !filterType || filterType === "ALL" || audit.auditType === filterType
    const matchesStatus = !filterStatus || filterStatus === "ALL" || audit.status === filterStatus
    const matchesRisk = !filterRisk || filterRisk === "ALL" || audit.riskLevel === filterRisk
    
    return matchesSearch && matchesType && matchesStatus && matchesRisk
  })

  const filteredComplianceRecords = complianceRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.requirement.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !filterType || filterType === "ALL" || record.regulationType === filterType
    const matchesStatus = !filterStatus || filterStatus === "ALL" || record.status === filterStatus
    const matchesRisk = !filterRisk || filterRisk === "ALL" || record.riskLevel === filterRisk
    
    return matchesSearch && matchesType && matchesStatus && matchesRisk
  })

  const auditStats = getAuditStats()
  const complianceStats = getComplianceStats()

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
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Audit & Compliance</h3>
          <p className="text-slate-600 dark:text-slate-300">
            Kelola audit kepatuhan dan rekam compliance perpajakan
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingAudit(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Audit Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAudit ? "Edit Audit" : "Audit Baru"}
                </DialogTitle>
                <DialogDescription>
                  Buat atau edit audit kepatuhan pajak
                </DialogDescription>
              </DialogHeader>
              <AuditForm 
                form={auditForm}
                onSubmit={editingAudit ? handleUpdateAudit : handleCreateAudit}
                initialData={editingAudit}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isComplianceDialogOpen} onOpenChange={setIsComplianceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setEditingCompliance(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Compliance Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCompliance ? "Edit Compliance Record" : "Compliance Record Baru"}
                </DialogTitle>
                <DialogDescription>
                  Tambah atau edit rekam compliance perpajakan
                </DialogDescription>
              </DialogHeader>
              <ComplianceForm 
                form={complianceForm}
                onSubmit={handleCreateCompliance}
                initialData={editingCompliance}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audit</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Semua audit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complianceStats.total > 0 ? Math.round((complianceStats.compliant / complianceStats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tingkat kepatuhan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance Score</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(auditStats.avgComplianceScore)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Skor compliance rata-rata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {audits.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Item berisiko tinggi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="audits">Audit</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Records</TabsTrigger>
        </TabsList>

        <TabsContent value="audits" className="space-y-4">
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
                      placeholder="Cari audit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Tipe</SelectItem>
                    <SelectItem value="INTERNAL">Internal</SelectItem>
                    <SelectItem value="EXTERNAL">External</SelectItem>
                    <SelectItem value="TAX_COMPLIANCE">Tax Compliance</SelectItem>
                    <SelectItem value="FINANCIAL">Financial</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="PLANNED">Direncanakan</SelectItem>
                    <SelectItem value="IN_PROGRESS">Sedang Berjalan</SelectItem>
                    <SelectItem value="COMPLETED">Selesai</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterRisk} onValueChange={setFilterRisk}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Risk</SelectItem>
                    <SelectItem value="LOW">Rendah</SelectItem>
                    <SelectItem value="MEDIUM">Sedang</SelectItem>
                    <SelectItem value="HIGH">Tinggi</SelectItem>
                    <SelectItem value="CRITICAL">Kritis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Audit Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Audit</CardTitle>
              <CardDescription>
                Daftar audit kepatuhan pajak yang telah dilakukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Judul</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Compliance Score</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudits.map((audit) => (
                      <TableRow key={audit.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{audit.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {audit.user.name || audit.user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{audit.auditType}</Badge>
                        </TableCell>
                        <TableCell>{getAuditStatusBadge(audit.status)}</TableCell>
                        <TableCell>{getRiskBadge(audit.riskLevel)}</TableCell>
                        <TableCell>
                          {audit.complianceScore ? (
                            <div className="flex items-center gap-2">
                              <Progress value={audit.complianceScore} className="w-16" />
                              <span className="text-sm">{audit.complianceScore}%</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(audit.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAudit(audit)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingAudit(audit)
                                setIsAuditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {audit.status === 'PLANNED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAudit(audit.id)}
                              >
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
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {/* Compliance Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Records</CardTitle>
              <CardDescription>
                Daftar rekam compliance perpajakan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Regulasi</TableHead>
                      <TableHead>Judul</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Next Review</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComplianceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Badge variant="outline">{record.regulationType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.regulationId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getComplianceStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          <Badge variant={record.priority === 'URGENT' ? 'destructive' : 'outline'}>
                            {record.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{getRiskBadge(record.riskLevel)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {record.nextReview ? formatDate(record.nextReview) : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCompliance(record)
                                setIsComplianceDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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
      </Tabs>

      {/* Audit Detail Dialog */}
      <Dialog open={!!selectedAudit} onOpenChange={() => setSelectedAudit(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Audit</DialogTitle>
            <DialogDescription>
              Informasi detail audit kepatuhan pajak
            </DialogDescription>
          </DialogHeader>
          {selectedAudit && (
            <AuditDetail audit={selectedAudit} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Form Components
function AuditForm({ form, onSubmit, initialData }: { 
  form: any, 
  onSubmit: (data: AuditFormData) => void,
  initialData?: Audit | null 
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul Audit</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan judul audit" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Masukkan deskripsi audit" 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="auditType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Audit</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe audit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INTERNAL">Internal</SelectItem>
                    <SelectItem value="EXTERNAL">External</SelectItem>
                    <SelectItem value="TAX_COMPLIANCE">Tax Compliance</SelectItem>
                    <SelectItem value="FINANCIAL">Financial</SelectItem>
                    <SelectItem value="SYSTEM">System</SelectItem>
                    <SelectItem value="OPERATIONAL">Operational</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scope</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih scope" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FULL">Full</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="TARGETED">Targeted</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Mulai</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Selesai</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="riskLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risk Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih risk level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="auditorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Auditor</FormLabel>
                <FormControl>
                  <Input placeholder="ID Auditor" {...field} />
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
                  placeholder="Masukkan catatan tambahan" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Reset
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function ComplianceForm({ form, onSubmit, initialData }: { 
  form: any, 
  onSubmit: (data: ComplianceFormData) => void,
  initialData?: ComplianceRecord | null 
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="regulationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Regulasi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe regulasi" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TAX_REGULATION">Tax Regulation</SelectItem>
                    <SelectItem value="ACCOUNTING_STANDARD">Accounting Standard</SelectItem>
                    <SelectItem value="LEGAL_REQUIREMENT">Legal Requirement</SelectItem>
                    <SelectItem value="INTERNAL_POLICY">Internal Policy</SelectItem>
                    <SelectItem value="INDUSTRY_STANDARD">Industry Standard</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="regulationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Regulasi</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan ID regulasi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan judul" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Masukkan deskripsi" 
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requirement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Persyaratan</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Masukkan persyaratan compliance" 
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="COMPLIANT">Compliant</SelectItem>
                    <SelectItem value="NOT_COMPLIANT">Not Compliant</SelectItem>
                    <SelectItem value="PARTIALLY_COMPLIANT">Partially Compliant</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="EXEMPTED">Exempted</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="riskLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risk Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih risk level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="complianceScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compliance Score (0-100)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    placeholder="0-100"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lastVerified"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Verifikasi Terakhir</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextReview"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Review Berikutnya</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="actionPlan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Action Plan</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Masukkan rencana tindakan" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Masukkan catatan tambahan" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Reset
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function AuditDetail({ audit }: { audit: Audit }) {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: id })
  }

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      LOW: { label: "Low", variant: "secondary" as const, color: "bg-green-100 text-green-800" },
      MEDIUM: { label: "Medium", variant: "outline" as const, color: "bg-yellow-100 text-yellow-800" },
      HIGH: { label: "High", variant: "default" as const, color: "bg-orange-100 text-orange-800" },
      CRITICAL: { label: "Critical", variant: "destructive" as const, color: "bg-red-100 text-red-800" }
    }

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.LOW
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getItemStatusBadge = (status: string) => {
    const statusConfig = {
      OPEN: { label: "Open", variant: "outline" as const, color: "bg-gray-100 text-gray-800" },
      IN_PROGRESS: { label: "In Progress", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      RESOLVED: { label: "Resolved", variant: "default" as const, color: "bg-green-100 text-green-800" },
      CANCELLED: { label: "Cancelled", variant: "secondary" as const, color: "bg-red-100 text-red-800" },
      ON_HOLD: { label: "On Hold", variant: "outline" as const, color: "bg-yellow-100 text-yellow-800" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.OPEN
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Audit Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Informasi Audit</h4>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Judul:</span> {audit.title}</div>
            <div><span className="font-medium">Tipe:</span> {audit.auditType}</div>
            <div><span className="font-medium">Scope:</span> {audit.scope}</div>
            <div><span className="font-medium">Status:</span> {audit.status}</div>
            <div><span className="font-medium">Risk Level:</span> {audit.riskLevel}</div>
            {audit.complianceScore && (
              <div><span className="font-medium">Compliance Score:</span> {audit.complianceScore}%</div>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Timeline</h4>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Dibuat:</span> {formatDate(audit.createdAt)}</div>
            {audit.startDate && (
              <div><span className="font-medium">Mulai:</span> {formatDate(audit.startDate)}</div>
            )}
            {audit.endDate && (
              <div><span className="font-medium">Selesai:</span> {formatDate(audit.endDate)}</div>
            )}
            <div><span className="font-medium">Update:</span> {formatDate(audit.updatedAt)}</div>
          </div>
        </div>
      </div>

      {/* Description */}
      {audit.description && (
        <div>
          <h4 className="font-semibold mb-2">Deskripsi</h4>
          <p className="text-sm text-muted-foreground">{audit.description}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{audit.findings}</div>
            <div className="text-sm text-muted-foreground">Findings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{audit.recommendations}</div>
            <div className="text-sm text-muted-foreground">Recommendations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{audit.auditItems.length}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {audit.auditItems.filter(item => item.status === 'RESOLVED').length}
            </div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Items */}
      <div>
        <h4 className="font-semibold mb-4">Audit Items</h4>
        {audit.auditItems.length > 0 ? (
          <div className="space-y-3">
            {audit.auditItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium">{item.title}</h5>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {getSeverityBadge(item.severity)}
                      {getItemStatusBadge(item.status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <span className="font-medium">Category:</span> {item.category}
                    </div>
                    {item.dueDate && (
                      <div>
                        <span className="font-medium">Due Date:</span> {formatDate(item.dueDate)}
                      </div>
                    )}
                  </div>

                  {item.finding && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">Finding:</span>
                      <p className="text-sm text-muted-foreground mt-1">{item.finding}</p>
                    </div>
                  )}

                  {item.recommendation && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">Recommendation:</span>
                      <p className="text-sm text-muted-foreground mt-1">{item.recommendation}</p>
                    </div>
                  )}

                  {item.notes && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">Notes:</span>
                      <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No audit items found.</p>
        )}
      </div>

      {/* Notes */}
      {audit.notes && (
        <div>
          <h4 className="font-semibold mb-2">Catatan</h4>
          <p className="text-sm text-muted-foreground">{audit.notes}</p>
        </div>
      )}
    </div>
  )
}