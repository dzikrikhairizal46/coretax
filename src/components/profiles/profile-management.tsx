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
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Shield,
  AlertTriangle,
  Copy,
  Download
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface UserProfile {
  id: string
  userId: string
  taxType: string
  taxId: string
  companyName?: string
  companyType?: string
  industry?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  description?: string
  npwp?: string
  nppkp?: string
  nik?: string
  ktpNumber?: string
  pkpNumber?: string
  taxOffice?: string
  province?: string
  city?: string
  postalCode?: string
  country?: string
  status: string
  isVerified: boolean
  verifiedAt?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    name?: string
    role: string
  }
}

interface ProfileFormData {
  taxType: string
  companyName?: string
  companyType?: string
  industry?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  description?: string
  npwp?: string
  nppkp?: string
  nik?: string
  ktpNumber?: string
  pkpNumber?: string
  taxOffice?: string
  province?: string
  city?: string
  postalCode?: string
  country?: string
}

export function ProfileManagement({ userRole }: { userRole?: string }) {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType) params.append('companyType', filterType)
      if (filterStatus) params.append('status', filterStatus)

      const response = await fetch(`/api/profiles?${params}`)
      const data = await response.json()
      setProfiles(data.profiles || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProfile = async (data: ProfileFormData) => {
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchProfiles()
        setIsDialogOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal membuat profil')
      }
    } catch (error) {
      console.error('Error creating profile:', error)
      alert('Gagal membuat profil')
    }
  }

  const handleUpdateProfile = async (data: ProfileFormData) => {
    if (!editingProfile) return

    try {
      const response = await fetch(`/api/profiles/${editingProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchProfiles()
        setIsDialogOpen(false)
        setEditingProfile(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal update profil')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Gagal update profil')
    }
  }

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus profil ini?')) return

    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchProfiles()
      } else {
        alert('Gagal menghapus profil')
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Gagal menghapus profil')
    }
  }

  const getStatusBadge = (status: string, isVerified: boolean) => {
    if (isVerified) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Terverifikasi
        </Badge>
      )
    }

    const statusConfig = {
      ACTIVE: { label: "Aktif", variant: "secondary" as const },
      INACTIVE: { label: "Non-aktif", variant: "outline" as const },
      SUSPENDED: { label: "Ditangguhkan", variant: "destructive" as const },
      PENDING_VERIFICATION: { label: "Menunggu Verifikasi", variant: "outline" as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getCompanyTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      PT: "Perseroan Terbatas (PT)",
      CV: "Commanditaire Vennootschap (CV)",
      FIRM: "Firma",
      UD: "Usaha Dagang (UD)",
      KOPERASI: "Koperasi",
      YAYASAN: "Yayasan",
      PERORANGAN: "Perorangan",
      LAINNYA: "Lainnya"
    }
    return labels[type || ""] || type || "-"
  }

  const getTaxTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PPH_21: "PPh Pasal 21",
      PPH_23: "PPh Pasal 23",
      PPH_25: "PPh Pasal 25",
      PPN: "PPN",
      PBB: "PBB",
      BPHTB: "BPHTB",
      PAJAK_KENDARAAN: "Pajak Kendaraan"
    }
    return labels[type] || type
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: id })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Disalin ke clipboard!')
  }

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = !searchTerm || 
      profile.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.taxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.npwp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !filterType || filterType === "ALL" || profile.companyType === filterType
    const matchesStatus = !filterStatus || filterStatus === "ALL" || profile.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const profileStats = {
    total: profiles.length,
    verified: profiles.filter(p => p.isVerified).length,
    pending: profiles.filter(p => p.status === 'PENDING_VERIFICATION').length,
    active: profiles.filter(p => p.status === 'ACTIVE').length
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
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Profil Wajib Pajak</h3>
          <p className="text-slate-600 dark:text-slate-300">
            Kelola profil perusahaan dan wajib pajak
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProfile(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Profil
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProfile ? "Edit Profil" : "Tambah Profil Baru"}
              </DialogTitle>
              <DialogDescription>
                Lengkapi informasi profil wajib pajak
              </DialogDescription>
            </DialogHeader>
            <ProfileForm 
              onSubmit={editingProfile ? handleUpdateProfile : handleCreateProfile}
              initialData={editingProfile}
              taxTypes={profiles.map(p => p.taxType)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profil</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Semua profil terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terverifikasi</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{profileStats.verified}</div>
            <p className="text-xs text-muted-foreground">
              {profileStats.total > 0 ? Math.round((profileStats.verified / profileStats.total) * 100) : 0}% dari total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Verifikasi</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{profileStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Memerlukan verifikasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{profileStats.active}</div>
            <p className="text-xs text-muted-foreground">
              Profil aktif
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
                  placeholder="Cari profil..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipe Perusahaan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Tipe</SelectItem>
                <SelectItem value="PT">PT</SelectItem>
                <SelectItem value="CV">CV</SelectItem>
                <SelectItem value="FIRM">Firma</SelectItem>
                <SelectItem value="UD">UD</SelectItem>
                <SelectItem value="KOPERASI">Koperasi</SelectItem>
                <SelectItem value="YAYASAN">Yayasan</SelectItem>
                <SelectItem value="PERORANGAN">Perorangan</SelectItem>
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
                <SelectItem value="SUSPENDED">Ditangguhkan</SelectItem>
                <SelectItem value="PENDING_VERIFICATION">Menunggu Verifikasi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Profiles List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProfiles.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Tidak ada profil yang ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          filteredProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {profile.companyName || "Profil Tanpa Nama"}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      ID: {profile.taxId}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(profile.status, profile.isVerified)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Jenis Pajak</span>
                    <Badge variant="outline">{getTaxTypeLabel(profile.taxType)}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tipe</span>
                    <span className="font-medium">{getCompanyTypeLabel(profile.companyType)}</span>
                  </div>
                  {profile.npwp && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">NPWP</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{profile.npwp}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(profile.npwp!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  {profile.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <span className="text-xs leading-tight">{profile.address}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedProfile(profile)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Detail
                    </Button>
                    {(userRole === 'ADMIN' || userRole === 'TAX_OFFICER') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingProfile(profile)
                          setIsDialogOpen(true)
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteProfile(profile.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Created Date */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Dibuat: {formatDate(profile.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Profile Detail Dialog */}
      {selectedProfile && (
        <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Profil</DialogTitle>
              <DialogDescription>
                Informasi lengkap profil wajib pajak
              </DialogDescription>
            </DialogHeader>
            <ProfileDetail profile={selectedProfile} userRole={userRole} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Profile Form Component
function ProfileForm({ 
  onSubmit, 
  initialData, 
  taxTypes 
}: { 
  onSubmit: (data: ProfileFormData) => void
  initialData?: UserProfile | null
  taxTypes?: string[]
}) {
  const [formData, setFormData] = useState<ProfileFormData>({
    taxType: initialData?.taxType || '',
    companyName: initialData?.companyName || '',
    companyType: initialData?.companyType || '',
    industry: initialData?.industry || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    website: initialData?.website || '',
    description: initialData?.description || '',
    npwp: initialData?.npwp || '',
    nppkp: initialData?.nppkp || '',
    nik: initialData?.nik || '',
    ktpNumber: initialData?.ktpNumber || '',
    pkpNumber: initialData?.pkpNumber || '',
    taxOffice: initialData?.taxOffice || '',
    province: initialData?.province || '',
    city: initialData?.city || '',
    postalCode: initialData?.postalCode || '',
    country: initialData?.country || 'Indonesia'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const availableTaxTypes = [
    { value: 'PPH_21', label: 'PPh Pasal 21' },
    { value: 'PPH_23', label: 'PPh Pasal 23' },
    { value: 'PPH_25', label: 'PPh Pasal 25' },
    { value: 'PPN', label: 'PPN' },
    { value: 'PBB', label: 'PBB' },
    { value: 'BPHTB', label: 'BPHTB' },
    { value: 'PAJAK_KENDARAAN', label: 'Pajak Kendaraan' }
  ].filter(type => !taxTypes?.includes(type.value) || type.value === initialData?.taxType)

  const companyTypes = [
    { value: 'PT', label: 'Perseroan Terbatas (PT)' },
    { value: 'CV', label: 'Commanditaire Vennootschap (CV)' },
    { value: 'FIRM', label: 'Firma' },
    { value: 'UD', label: 'Usaha Dagang (UD)' },
    { value: 'KOPERASI', label: 'Koperasi' },
    { value: 'YAYASAN', label: 'Yayasan' },
    { value: 'PERORANGAN', label: 'Perorangan' },
    { value: 'LAINNYA', label: 'Lainnya' }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Data Dasar</TabsTrigger>
          <TabsTrigger value="tax">Data Pajak</TabsTrigger>
          <TabsTrigger value="contact">Kontak</TabsTrigger>
          <TabsTrigger value="address">Alamat</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Jenis Pajak *</label>
              <Select 
                value={formData.taxType} 
                onValueChange={(value) => setFormData({ ...formData, taxType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis pajak" />
                </SelectTrigger>
                <SelectContent>
                  {availableTaxTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tipe Perusahaan</label>
              <Select 
                value={formData.companyType || ''} 
                onValueChange={(value) => setFormData({ ...formData, companyType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe perusahaan" />
                </SelectTrigger>
                <SelectContent>
                  {companyTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Nama Perusahaan</label>
              <Input
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Nama perusahaan"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Industri</label>
              <Input
                value={formData.industry || ''}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Bidang industri"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Deskripsi</label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi perusahaan"
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">NPWP</label>
              <Input
                value={formData.npwp || ''}
                onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                placeholder="XX.XXX.XXX.X-XXX.XXX"
              />
            </div>
            <div>
              <label className="text-sm font-medium">NPPKP</label>
              <Input
                value={formData.nppkp || ''}
                onChange={(e) => setFormData({ ...formData, nppkp: e.target.value })}
                placeholder="Nomor Pengukuhan Pengusaha Kena Pajak"
              />
            </div>
            <div>
              <label className="text-sm font-medium">NIK</label>
              <Input
                value={formData.nik || ''}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                placeholder="Nomor Induk Kependudukan"
              />
            </div>
            <div>
              <label className="text-sm font-medium">No. KTP</label>
              <Input
                value={formData.ktpNumber || ''}
                onChange={(e) => setFormData({ ...formData, ktpNumber: e.target.value })}
                placeholder="Nomor Kartu Tanda Penduduk"
              />
            </div>
            <div>
              <label className="text-sm font-medium">No. PKP</label>
              <Input
                value={formData.pkpNumber || ''}
                onChange={(e) => setFormData({ ...formData, pkpNumber: e.target.value })}
                placeholder="Nomor Pengukuhan PKP"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Kantor Pajak</label>
              <Input
                value={formData.taxOffice || ''}
                onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                placeholder="Kantor Pelayanan Pajak"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@perusahaan.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telepon</label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+62 XXX XXXX XXXX"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Website</label>
              <Input
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.perusahaan.com"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Alamat Lengkap</label>
              <Textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Alamat lengkap"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Provinsi</label>
                <Input
                  value={formData.province || ''}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="Provinsi"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kota</label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Kota/Kabupaten"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kode Pos</label>
                <Input
                  value={formData.postalCode || ''}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="XXXXX"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Negara</label>
              <Input
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Negara"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={() => setFormData(initialData ? { ...formData } : { ...formData, taxType: '' })}>
          Reset
        </Button>
        <Button type="submit">
          {initialData ? 'Update Profil' : 'Simpan Profil'}
        </Button>
      </div>
    </form>
  )
}

// Profile Detail Component
function ProfileDetail({ profile, userRole }: { profile: UserProfile; userRole?: string }) {
  const getCompanyTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      PT: "Perseroan Terbatas (PT)",
      CV: "Commanditaire Vennootschap (CV)",
      FIRM: "Firma",
      UD: "Usaha Dagang (UD)",
      KOPERASI: "Koperasi",
      YAYASAN: "Yayasan",
      PERORANGAN: "Perorangan",
      LAINNYA: "Lainnya"
    }
    return labels[type || ""] || type || "-"
  }

  const getTaxTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PPH_21: "PPh Pasal 21",
      PPH_23: "PPh Pasal 23",
      PPH_25: "PPh Pasal 25",
      PPN: "PPN",
      PBB: "PBB",
      BPHTB: "BPHTB",
      PAJAK_KENDARAAN: "Pajak Kendaraan"
    }
    return labels[type] || type
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy HH:mm', { locale: id })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Disalin ke clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-xl font-semibold">{profile.companyName || "Profil Tanpa Nama"}</h4>
          <p className="text-muted-foreground">ID: {profile.taxId}</p>
        </div>
        <div className="flex flex-col gap-2">
          {profile.isVerified ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Terverifikasi
            </Badge>
          ) : (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              Belum Terverifikasi
            </Badge>
          )}
          <Badge variant={profile.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {profile.status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="tax">Data Pajak</TabsTrigger>
          <TabsTrigger value="contact">Kontak</TabsTrigger>
          <TabsTrigger value="activity">Aktivitas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium mb-2">Informasi Dasar</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jenis Pajak</span>
                  <Badge variant="outline">{getTaxTypeLabel(profile.taxType)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipe Perusahaan</span>
                  <span>{getCompanyTypeLabel(profile.companyType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industri</span>
                  <span>{profile.industry || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={profile.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {profile.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-2">Informasi Sistem</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dibuat</span>
                  <span>{formatDate(profile.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Terakhir Update</span>
                  <span>{formatDate(profile.updatedAt)}</span>
                </div>
                {profile.verifiedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diverifikasi</span>
                    <span>{formatDate(profile.verifiedAt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Oleh User</span>
                  <span>{profile.user.name || profile.user.email}</span>
                </div>
              </div>
            </div>
          </div>

          {profile.description && (
            <div>
              <h5 className="font-medium mb-2">Deskripsi</h5>
              <p className="text-sm text-muted-foreground">{profile.description}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium mb-2">Identitas Pajak</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">NPWP</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{profile.npwp || '-'}</span>
                    {profile.npwp && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(profile.npwp!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NPPKP</span>
                  <span>{profile.nppkp || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. PKP</span>
                  <span>{profile.pkpNumber || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kantor Pajak</span>
                  <span>{profile.taxOffice || '-'}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-2">Identitas Pribadi</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NIK</span>
                  <span>{profile.nik || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. KTP</span>
                  <span>{profile.ktpNumber || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium mb-2">Kontak Utama</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <div className="flex items-center gap-2">
                    <span>{profile.email || '-'}</span>
                    {profile.email && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(profile.email!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Telepon</span>
                  <div className="flex items-center gap-2">
                    <span>{profile.phone || '-'}</span>
                    {profile.phone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(profile.phone!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-2">Online Presence</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Website</span>
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[150px]">{profile.website || '-'}</span>
                    {profile.website && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(profile.website!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Profil dibuat</p>
                <p className="text-xs text-muted-foreground">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
            
            {profile.updatedAt !== profile.createdAt && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Profil diperbarui</p>
                  <p className="text-xs text-muted-foreground">{formatDate(profile.updatedAt)}</p>
                </div>
              </div>
            )}

            {profile.verifiedAt && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Profil diverifikasi</p>
                  <p className="text-xs text-muted-foreground">{formatDate(profile.verifiedAt)}</p>
                </div>
              </div>
            )}
          </div>

          {(userRole === 'ADMIN' || userRole === 'TAX_OFFICER') && !profile.isVerified && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Profil ini belum diverifikasi. Anda dapat melakukan verifikasi dari menu admin.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}