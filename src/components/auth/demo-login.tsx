"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, User, Building, Briefcase, Shield, Users } from "lucide-react"

interface DemoLoginProps {
  onDemoLogin: (email: string, password: string) => void
}

export function DemoLogin({ onDemoLogin }: DemoLoginProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const demoUsers = [
    {
      email: "admin@coretax.id",
      password: "admin123",
      name: "Administrator",
      role: "ADMIN",
      company: "Direktorat Jenderal Pajak",
      icon: Shield,
      color: "text-red-600"
    },
    {
      email: "wajibpajak1@coretax.id",
      password: "wajib123",
      name: "Budi Santoso",
      role: "WAJIB_PAJAK",
      company: "PT. Maju Bersama",
      icon: Building,
      color: "text-blue-600"
    },
    {
      email: "wajibpajak2@coretax.id",
      password: "wajib123",
      name: "Siti Rahayu",
      role: "WAJIB_PAJAK",
      company: "CV. Sukses Sejahtera",
      icon: Building,
      color: "text-green-600"
    },
    {
      email: "petugas@coretax.id",
      password: "petugas123",
      name: "Ahmad Wijaya",
      role: "TAX_OFFICER",
      company: "Kantor Pajak Pratama",
      icon: Briefcase,
      color: "text-purple-600"
    },
    {
      email: "konsultan@coretax.id",
      password: "konsultan123",
      name: "Dewi Lestari",
      role: "CONSULTANT",
      company: "Konsultan Pajak Profesional",
      icon: Users,
      color: "text-orange-600"
    }
  ]

  const handleDemoLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        onDemoLogin(email, password)
      } else {
        setError(data.error || "Demo login failed")
      }
    } catch (error) {
      console.error("Demo login error:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl">Akun Demo CoreTax-ID</CardTitle>
        <CardDescription>
          Pilih akun demo di bawah ini untuk mencoba sistem tanpa perlu registrasi
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoUsers.map((user, index) => {
            const Icon = user.icon
            return (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-6 w-6 ${user.color}`} />
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {user.company}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      <strong>Email:</strong> {user.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <strong>Password:</strong> {user.password}
                    </div>
                    <Button
                      onClick={() => handleDemoLogin(user.email, user.password)}
                      disabled={isLoading}
                      className="w-full mt-3"
                      size="sm"
                    >
                      {isLoading ? "Memproses..." : "Login Demo"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🎯 Panduan Demo
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Klik tombol "Login Demo" pada akun yang ingin dicoba</li>
            <li>• Setiap akun memiliki role dan akses yang berbeda</li>
            <li>• <strong>Admin:</strong> Akses penuh ke semua fitur sistem</li>
            <li>• <strong>Wajib Pajak:</strong> Akses untuk mengelola SPT dan pembayaran</li>
            <li>• <strong>Petugas Pajak:</strong> Akses untuk verifikasi dan laporan</li>
            <li>• <strong>Konsultan:</strong> Akses untuk konsultasi dan bantuan</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}