"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Archive, 
  Restore,
  Search,
  Filter,
  MoreHorizontal,
  File,
  Image,
  FileVideo,
  FileAudio,
  Archive as ArchiveIcon
} from "lucide-react"
import { formatFileSize, formatDate } from "@/lib/utils"

interface Document {
  id: string
  title: string
  description?: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  category: string
  tags?: string
  isPublic: boolean
  status: string
  createdAt: string
  updatedAt: string
}

const DOCUMENT_CATEGORIES = [
  { value: "SPT_TAHUNAN", label: "SPT Tahunan" },
  { value: "SPT_MASA", label: "SPT Masa" },
  { value: "BUKTI_PEMBAYARAN", label: "Bukti Pembayaran" },
  { value: "FAKTUR_PAJAK", label: "Faktur Pajak" },
  { value: "KUITANSI", label: "Kuitansi" },
  { value: "LAPORAN_KEUANGAN", label: "Laporan Keuangan" },
  { value: "SURAT_KETERANGAN", label: "Surat Keterangan" },
  { value: "DOKUMEN_PENDUKUNG", label: "Dokumen Pendukung" },
  { value: "LAINNYA", label: "Lainnya" }
]

const DOCUMENT_STATUSES = [
  { value: "ACTIVE", label: "Aktif", color: "bg-green-100 text-green-800" },
  { value: "ARCHIVED", label: "Diarsipkan", color: "bg-yellow-100 text-yellow-800" },
  { value: "PENDING_REVIEW", label: "Menunggu Review", color: "bg-blue-100 text-blue-800" }
]

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <Image className="h-4 w-4" alt="Image file" />
  if (fileType.startsWith('video/')) return <FileVideo className="h-4 w-4" alt="Video file" />
  if (fileType.startsWith('audio/')) return <FileAudio className="h-4 w-4" alt="Audio file" />
  if (fileType.includes('pdf')) return <FileText className="h-4 w-4" alt="PDF file" />
  if (fileType.includes('zip') || fileType.includes('rar')) return <ArchiveIcon className="h-4 w-4" alt="Archive file" />
  return <File className="h-4 w-4" alt="Generic file" />
}

export function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [activeTab, setActiveTab] = useState("documents")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)

      const response = await fetch(`/api/documents?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        setIsUploadDialogOpen(false)
        fetchDocuments()
        // Reset form
        event.currentTarget.reset()
      }
    } catch (error) {
      console.error('Error uploading document:', error)
    }
  }

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingDocument) return

    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      const response = await fetch(`/api/documents/${editingDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        fetchDocuments()
        setEditingDocument(null)
      }
    } catch (error) {
      console.error('Error updating document:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) return

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedDocuments.length === 0) return

    try {
      const response = await fetch('/api/documents/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          documentIds: selectedDocuments
        })
      })

      if (response.ok) {
        setSelectedDocuments([])
        fetchDocuments()
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }
  }

  const filteredDocuments = documents

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Dokumen</h2>
          <p className="text-muted-foreground">
            Kelola dokumen dan arsip pajak Anda dengan mudah
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Dokumen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Dokumen Baru</DialogTitle>
              <DialogDescription>
                Upload dokumen pajak atau arsip penting Anda
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="file">File Dokumen</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="title">Judul Dokumen</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  name="description"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select name="category" required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="contoh: penting,2024,laporan"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="isPublic" name="isPublic" />
                <Label htmlFor="isPublic">Dokumen publik</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">Upload</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents">Dokumen Saya</TabsTrigger>
          <TabsTrigger value="archived">Diarsipkan</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cari dokumen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {DOCUMENT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    {DOCUMENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={fetchDocuments} variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedDocuments.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedDocuments.length} dokumen dipilih
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('archive')}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Arsipkan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('setPublic')}
                    >
                      Jadikan Publik
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBulkAction('delete')}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <CardTitle>Dokumen Saya</CardTitle>
              <CardDescription>
                Daftar dokumen pajak dan arsip Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDocuments(filteredDocuments.map(d => d.id))
                            } else {
                              setSelectedDocuments([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Nama Dokumen</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Ukuran</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Upload</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedDocuments.includes(document.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDocuments([...selectedDocuments, document.id])
                              } else {
                                setSelectedDocuments(selectedDocuments.filter(id => id !== document.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {getFileIcon(document.fileType)}
                            <div>
                              <div className="font-medium">{document.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {document.fileName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {DOCUMENT_CATEGORIES.find(c => c.value === document.category)?.label || document.category}
                        </TableCell>
                        <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                        <TableCell>
                          <Badge className={
                            DOCUMENT_STATUSES.find(s => s.value === document.status)?.color || ""
                          }>
                            {DOCUMENT_STATUSES.find(s => s.value === document.status)?.label || document.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(document.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(document.fileUrl, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingDocument(document)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(document.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dokumen Diarsipkan</CardTitle>
              <CardDescription>
                Dokumen yang telah diarsipkan dapat dipulihkan kembali
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Fitur arsip akan segera tersedia</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Dokumen</DialogTitle>
            <DialogDescription>
              Perbarui informasi dokumen Anda
            </DialogDescription>
          </DialogHeader>
          {editingDocument && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Judul Dokumen</Label>
                <Input
                  id="edit-title"
                  name="title"
                  defaultValue={editingDocument.title}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Deskripsi</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingDocument.description || ''}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Kategori</Label>
                <Select name="category" defaultValue={editingDocument.category} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags (pisahkan dengan koma)</Label>
                <Input
                  id="edit-tags"
                  name="tags"
                  defaultValue={editingDocument.tags || ''}
                  placeholder="contoh: penting,2024,laporan"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select name="status" defaultValue={editingDocument.status} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isPublic"
                  name="isPublic"
                  defaultChecked={editingDocument.isPublic}
                />
                <Label htmlFor="edit-isPublic">Dokumen publik</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}