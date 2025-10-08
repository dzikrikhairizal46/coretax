"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Search, Plus, Edit, Trash2, Users, Clock, MessageSquare, Star, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Consultation {
  id: string
  title: string
  description: string
  taxType?: string
  category: string
  priority: string
  status: string
  response?: string
  scheduledAt?: string
  completedAt?: string
  rating?: number
  feedback?: string
  tags?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  user: User
  consultant?: User
}

const consultationCategories = [
  "GENERAL_TAX",
  "PPH_CALCULATION", 
  "PPN_GUIDANCE",
  "TAX_PLANNING",
  "TAX_DISPUTE",
  "COMPLIANCE_REVIEW",
  "INTERNATIONAL_TAX",
  "TRANSFER_PRICING",
  "TAX_AUDIT",
  "OTHER"
]

const consultationPriorities = [
  { value: "LOW", label: "Rendah", color: "bg-green-100 text-green-800" },
  { value: "MEDIUM", label: "Sedang", color: "bg-yellow-100 text-yellow-800" },
  { value: "HIGH", label: "Tinggi", color: "bg-orange-100 text-orange-800" },
  { value: "URGENT", label: "Darurat", color: "bg-red-100 text-red-800" }
]

const consultationStatuses = [
  { value: "OPEN", label: "Terbuka", color: "bg-gray-100 text-gray-800" },
  { value: "ASSIGNED", label: "Ditugaskan", color: "bg-blue-100 text-blue-800" },
  { value: "IN_PROGRESS", label: "Dalam Proses", color: "bg-purple-100 text-purple-800" },
  { value: "COMPLETED", label: "Selesai", color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Dibatalkan", color: "bg-red-100 text-red-800" },
  { value: "ON_HOLD", label: "Ditahan", color: "bg-yellow-100 text-yellow-800" }
]

const taxTypes = [
  "PPH_21",
  "PPH_23", 
  "PPH_25",
  "PPN",
  "PBB",
  "BPHTB",
  "PAJAK_KENDARAAN"
]

export function ConsultationManagement() {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [filteredConsultations, setFilteredConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedPriority, setSelectedPriority] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)
  const [selectedConsultations, setSelectedConsultations] = useState<string[]>([])
  const [consultants, setConsultants] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState("all")
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    taxType: "",
    category: "",
    priority: "MEDIUM",
    scheduledAt: "",
    tags: "",
    isPublic: false,
    response: "",
    consultantId: "",
    status: ""
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchConsultations()
    fetchConsultants()
  }, [])

  useEffect(() => {
    filterConsultations()
  }, [consultations, searchTerm, selectedCategory, selectedStatus, selectedPriority, activeTab])

  const fetchConsultations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/consultations")
      if (response.ok) {
        const data = await response.json()
        setConsultations(data.consultations || [])
      }
    } catch (error) {
      console.error("Error fetching consultations:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data konsultasi",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchConsultants = async () => {
    try {
      const response = await fetch("/api/profiles")
      if (response.ok) {
        const data = await response.json()
        const consultantUsers = data.profiles?.filter((p: any) => p.user.role === "CONSULTANT") || []
        setConsultants(consultantUsers.map((c: any) => c.user))
      }
    } catch (error) {
      console.error("Error fetching consultants:", error)
    }
  }

  const filterConsultations = () => {
    let filtered = consultations

    if (activeTab !== "all") {
      filtered = filtered.filter(c => c.status === activeTab.toUpperCase())
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tags?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory && selectedCategory !== "ALL") {
      filtered = filtered.filter(c => c.category === selectedCategory)
    }

    if (selectedStatus && selectedStatus !== "ALL") {
      filtered = filtered.filter(c => c.status === selectedStatus)
    }

    if (selectedPriority && selectedPriority !== "ALL") {
      filtered = filtered.filter(c => c.priority === selectedPriority)
    }

    setFilteredConsultations(filtered)
  }

  const handleCreateConsultation = async () => {
    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchConsultations()
        setIsCreateDialogOpen(false)
        resetForm()
        toast({
          title: "Berhasil",
          description: "Konsultasi berhasil dibuat"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Gagal membuat konsultasi",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating consultation:", error)
      toast({
        title: "Error",
        description: "Gagal membuat konsultasi",
        variant: "destructive"
      })
    }
  }

  const handleUpdateConsultation = async () => {
    if (!selectedConsultation) return

    try {
      const response = await fetch(`/api/consultations/${selectedConsultation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchConsultations()
        setIsEditDialogOpen(false)
        resetForm()
        toast({
          title: "Berhasil",
          description: "Konsultasi berhasil diperbarui"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Gagal memperbarui konsultasi",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating consultation:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui konsultasi",
        variant: "destructive"
      })
    }
  }

  const handleDeleteConsultation = async (id: string) => {
    try {
      const response = await fetch(`/api/consultations/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchConsultations()
        toast({
          title: "Berhasil",
          description: "Konsultasi berhasil dihapus"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Gagal menghapus konsultasi",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting consultation:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus konsultasi",
        variant: "destructive"
      })
    }
  }

  const handleBulkAction = async (action: string, data?: any) => {
    if (selectedConsultations.length === 0) {
      toast({
        title: "Peringatan",
        description: "Pilih minimal satu konsultasi",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch("/api/consultations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, consultationIds: selectedConsultations, data })
      })

      if (response.ok) {
        await fetchConsultations()
        setSelectedConsultations([])
        toast({
          title: "Berhasil",
          description: `Aksi bulk ${action} berhasil dilakukan`
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || `Gagal melakukan aksi bulk ${action}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error performing bulk action:", error)
      toast({
        title: "Error",
        description: `Gagal melakukan aksi bulk ${action}`,
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      taxType: "",
      category: "",
      priority: "MEDIUM",
      scheduledAt: "",
      tags: "",
      isPublic: false,
      response: "",
      consultantId: "",
      status: ""
    })
    setSelectedConsultation(null)
  }

  const openEditDialog = (consultation: Consultation) => {
    setSelectedConsultation(consultation)
    setFormData({
      title: consultation.title,
      description: consultation.description,
      taxType: consultation.taxType || "",
      category: consultation.category,
      priority: consultation.priority,
      scheduledAt: consultation.scheduledAt || "",
      tags: consultation.tags || "",
      isPublic: consultation.isPublic,
      response: consultation.response || "",
      consultantId: consultation.consultant?.id || "",
      status: consultation.status
    })
    setIsEditDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = consultationStatuses.find(s => s.value === status)
    return statusInfo ? (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    ) : (
      <Badge variant="outline">{status}</Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityInfo = consultationPriorities.find(p => p.value === priority)
    return priorityInfo ? (
      <Badge className={priorityInfo.color}>
        {priorityInfo.label}
      </Badge>
    ) : (
      <Badge variant="outline">{priority}</Badge>
    )
  }

  const renderStars = (rating?: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Konsultasi Pajak Virtual</h2>
          <p className="text-gray-600">Kelola sesi konsultasi pajak dengan konsultan profesional</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Buat Konsultasi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buat Konsultasi Baru</DialogTitle>
              <DialogDescription>
                Ajukan pertanyaan atau konsultasi seputar perpajakan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Judul</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masukkan judul konsultasi"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Deskripsi</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan detail pertanyaan atau masalah pajak Anda"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Kategori</label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {consultationCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Jenis Pajak</label>
                  <Select value={formData.taxType} onValueChange={(value) => setFormData({ ...formData, taxType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis pajak" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Tidak spesifik</SelectItem>
                      {taxTypes.map((taxType) => (
                        <SelectItem key={taxType} value={taxType}>
                          {taxType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Prioritas</label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {consultationPriorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Jadwal Konsultasi</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.scheduledAt ? format(new Date(formData.scheduledAt), "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.scheduledAt ? new Date(formData.scheduledAt) : undefined}
                        onSelect={(date) => setFormData({ ...formData, scheduledAt: date?.toISOString() || "" })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tag</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Tag (pisahkan dengan koma)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreateConsultation}>
                Buat Konsultasi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari konsultasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kategori</SelectItem>
                {consultationCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                {consultationStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Prioritas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Prioritas</SelectItem>
                {consultationPriorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="open">Terbuka</TabsTrigger>
          <TabsTrigger value="assigned">Ditugaskan</TabsTrigger>
          <TabsTrigger value="in_progress">Dalam Proses</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Bulk Actions */}
          {selectedConsultations.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedConsultations.length} konsultasi dipilih
                  </span>
                  <div className="flex gap-2">
                    <Select onValueChange={(value) => handleBulkAction('updateStatus', { status: value })}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {consultationStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={(value) => handleBulkAction('updatePriority', { priority: value })}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Update Prioritas" />
                      </SelectTrigger>
                      <SelectContent>
                        {consultationPriorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('setPublic')}
                    >
                      Set Publik
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('setPrivate')}
                    >
                      Set Privat
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Hapus
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Konsultasi</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus {selectedConsultations.length} konsultasi yang dipilih?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleBulkAction('delete')}>
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consultations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Konsultasi</CardTitle>
              <CardDescription>
                Total {filteredConsultations.length} konsultasi ditemukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedConsultations.length === filteredConsultations.length && filteredConsultations.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedConsultations(filteredConsultations.map(c => c.id))
                            } else {
                              setSelectedConsultations([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Judul</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Prioritas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Konsultan</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConsultations.map((consultation) => (
                      <TableRow key={consultation.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedConsultations.includes(consultation.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedConsultations([...selectedConsultations, consultation.id])
                              } else {
                                setSelectedConsultations(selectedConsultations.filter(id => id !== consultation.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{consultation.title}</div>
                            <div className="text-sm text-gray-600 truncate max-w-xs">
                              {consultation.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {consultation.category.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(consultation.priority)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(consultation.status)}
                        </TableCell>
                        <TableCell>
                          {consultation.consultant ? (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              <span className="text-sm">{consultation.consultant.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Belum ditugaskan</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(consultation.createdAt), "dd/MM/yyyy")}</div>
                            {consultation.scheduledAt && (
                              <div className="text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(new Date(consultation.scheduledAt), "dd/MM/yyyy")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(consultation)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Konsultasi</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus konsultasi "{consultation.title}"?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteConsultation(consultation.id)}>
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Konsultasi</DialogTitle>
            <DialogDescription>
              Perbarui informasi konsultasi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Judul</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {consultationStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Deskripsi</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Kategori</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {consultationCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Jenis Pajak</label>
                <Select value={formData.taxType} onValueChange={(value) => setFormData({ ...formData, taxType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Tidak spesifik</SelectItem>
                    {taxTypes.map((taxType) => (
                      <SelectItem key={taxType} value={taxType}>
                        {taxType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Prioritas</label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {consultationPriorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Konsultan</label>
                <Select value={formData.consultantId} onValueChange={(value) => setFormData({ ...formData, consultantId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih konsultan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNASSIGNED">Belum ditugaskan</SelectItem>
                    {consultants.map((consultant) => (
                      <SelectItem key={consultant.id} value={consultant.id}>
                        {consultant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Jadwal Konsultasi</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.scheduledAt ? format(new Date(formData.scheduledAt), "PPP") : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.scheduledAt ? new Date(formData.scheduledAt) : undefined}
                      onSelect={(date) => setFormData({ ...formData, scheduledAt: date?.toISOString() || "" })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Respon Konsultan</label>
              <Textarea
                value={formData.response}
                onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                placeholder="Masukkan respon atau jawaban dari konsultan"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tag</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Tag (pisahkan dengan koma)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateConsultation}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}