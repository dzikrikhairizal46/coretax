"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { DemoLogin } from "@/components/auth/demo-login"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("demo")
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("coretax-user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        router.push("/")
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("coretax-user")
      }
    }
  }, [router])

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser)
    router.push("/")
  }

  const handleRegisterSuccess = (registeredUser: any) => {
    setUser(registeredUser)
    router.push("/")
  }

  const handleDemoLogin = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("coretax-user", JSON.stringify(data.user))
        setUser(data.user)
        router.push("/")
      } else {
        console.error("Demo login failed:", data.error)
      }
    } catch (error) {
      console.error("Demo login error:", error)
    }
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Mengalihkan ke dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="demo">Demo</TabsTrigger>
            <TabsTrigger value="login">Masuk</TabsTrigger>
            <TabsTrigger value="register">Daftar</TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="mt-0">
            <DemoLogin onDemoLogin={handleDemoLogin} />
          </TabsContent>

          <TabsContent value="login" className="mt-0 flex justify-center">
            <LoginForm
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setActiveTab("register")}
            />
          </TabsContent>

          <TabsContent value="register" className="mt-0 flex justify-center">
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              onSwitchToLogin={() => setActiveTab("login")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}