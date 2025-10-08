"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target,
  BarChart3,
  PieChart
} from "lucide-react"

interface TaxOverviewProps {
  userRole?: string
}

export function TaxOverview({ userRole = "WAJIB_PAJAK" }: TaxOverviewProps) {
  // Dummy data untuk demo
  const overviewData = {
    yearlyTarget: 500000000,
    yearlyAchieved: 420000000,
    monthlyComparison: {
      currentMonth: 450000000,
      previousMonth: 416000000,
      growth: 8.2
    },
    taxBreakdown: [
      { type: "PPN", amount: 180000000, percentage: 42.9, color: "bg-blue-500" },
      { type: "PPh 21", amount: 120000000, percentage: 28.6, color: "bg-green-500" },
      { type: "PPh 23", amount: 65000000, percentage: 15.5, color: "bg-purple-500" },
      { type: "PPh 25", amount: 35000000, percentage: 8.3, color: "bg-orange-500" },
      { type: "Lainnya", amount: 20000000, percentage: 4.7, color: "bg-gray-500" }
    ],
    complianceMetrics: {
      onTimeSubmission: 85,
      accurateReporting: 92,
      paymentCompliance: 78
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const yearlyProgress = (overviewData.yearlyAchieved / overviewData.yearlyTarget) * 100

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Yearly Target Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Target Tahunan
          </CardTitle>
          <CardDescription>
            Progress pencapaian target pajak tahun 2024
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(overviewData.yearlyAchieved)}</p>
                <p className="text-sm text-muted-foreground">
                  dari target {formatCurrency(overviewData.yearlyTarget)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{yearlyProgress.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">tercapai</p>
              </div>
            </div>
            <Progress value={yearlyProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Perbandingan Bulanan
          </CardTitle>
          <CardDescription>
            Perbandingan pembayaran pajak bulan ini vs bulan lalu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bulan Ini (Nov 2024)</p>
                <p className="text-xl font-bold">{formatCurrency(overviewData.monthlyComparison.currentMonth)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Bulan Lalu (Okt 2024)</p>
                <p className="text-xl font-bold">{formatCurrency(overviewData.monthlyComparison.previousMonth)}</p>
              </div>
            </div>
            <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-lg font-semibold text-green-600">
                +{overviewData.monthlyComparison.growth}%
              </span>
              <span className="text-sm text-green-600 ml-1">dari bulan lalu</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Komposisi Pajak
          </CardTitle>
          <CardDescription>
            Perincian jenis pajak yang dibayarkan tahun ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overviewData.taxBreakdown.map((tax, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 ${tax.color} rounded-full`}></div>
                    <span className="text-sm font-medium">{tax.type}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(tax.amount)}</p>
                    <p className="text-xs text-muted-foreground">{tax.percentage}%</p>
                  </div>
                </div>
                <Progress value={tax.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Metrik Kepatuhan
          </CardTitle>
          <CardDescription>
            Tingkat kepatuhan dalam administrasi pajak
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ketepatan Waktu</span>
                <span className="text-sm font-medium">{overviewData.complianceMetrics.onTimeSubmission}%</span>
              </div>
              <Progress value={overviewData.complianceMetrics.onTimeSubmission} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Akurasi Pelaporan</span>
                <span className="text-sm font-medium">{overviewData.complianceMetrics.accurateReporting}%</span>
              </div>
              <Progress value={overviewData.complianceMetrics.accurateReporting} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kepatuhan Pembayaran</span>
                <span className="text-sm font-medium">{overviewData.complianceMetrics.paymentCompliance}%</span>
              </div>
              <Progress value={overviewData.complianceMetrics.paymentCompliance} className="h-2" />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-sm font-medium">Skor Kepatuhan Overall</span>
              <Badge variant="secondary">
                {Math.round((overviewData.complianceMetrics.onTimeSubmission + 
                           overviewData.complianceMetrics.accurateReporting + 
                           overviewData.complianceMetrics.paymentCompliance) / 3)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}