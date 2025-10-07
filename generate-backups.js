#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const tar = require('tar');

// Phase definitions with their respective features
const phases = {
  1: {
    name: "Struktur Dasar",
    description: "Basic project structure and configuration",
    files: [
      "package.json",
      "tsconfig.json", 
      "tailwind.config.ts",
      "next.config.ts",
      "components.json",
      "eslint.config.mjs",
      "postcss.config.mjs",
      "src/app/layout.tsx",
      "src/app/page.tsx",
      "src/app/globals.css",
      "src/lib/utils.ts",
      "src/lib/db.ts",
      "src/lib/auth.ts",
      "prisma/schema.prisma"
    ]
  },
  2: {
    name: "Autentikasi & Manajemen Pengguna",
    description: "Authentication and user management system",
    files: [
      "src/app/auth/page.tsx",
      "src/components/auth/login-form.tsx",
      "src/components/auth/register-form.tsx",
      "src/components/auth/demo-login.tsx",
      "src/app/api/auth/login/route.ts",
      "src/app/api/auth/register/route.ts",
      "src/app/api/auth/demo/route.ts",
      "src/app/api/profiles/route.ts",
      "src/app/api/profiles/[id]/route.ts",
      "src/app/api/profiles/verify/route.ts",
      "src/components/profiles/profile-management.tsx"
    ]
  },
  3: {
    name: "Dashboard Utama dengan Widget Pajak",
    description: "Main dashboard with tax widgets",
    files: [
      "src/components/dashboard/dashboard-stats.tsx",
      "src/components/dashboard/tax-overview.tsx",
      "src/components/dashboard/recent-reports.tsx",
      "src/components/dashboard/recent-payments.tsx",
      "src/components/dashboard/tax-notifications.tsx"
    ]
  },
  4: {
    name: "Manajemen SPT",
    description: "SPT (Tax Return) management system",
    files: [
      "src/components/spt/spt-management.tsx"
    ]
  },
  5: {
    name: "Modul Pembayaran Pajak",
    description: "Tax payment module",
    files: [
      "src/components/payment/payment-management.tsx"
    ]
  },
  6: {
    name: "Modul Laporan dan Analitik",
    description: "Reports and analytics module",
    files: [
      "src/components/reports/reports-analytics.tsx"
    ]
  },
  7: {
    name: "Sistem Notifikasi dan Reminder",
    description: "Notification and reminder system",
    files: [
      "src/components/notifications/notification-management.tsx",
      "src/app/api/notifications/route.ts",
      "src/app/api/notifications/[id]/route.ts",
      "src/app/api/notifications/bulk/route.ts",
      "src/app/api/notifications/reminders/route.ts",
      "src/app/api/notifications/settings/route.ts"
    ]
  },
  8: {
    name: "Manajemen Profil Perusahaan/Wajib Pajak",
    description: "Company and taxpayer profile management",
    files: [
      "src/components/profiles/profile-management.tsx"
    ]
  },
  9: {
    name: "Modul Dokumen dan Arsip",
    description: "Document and archive management",
    files: [
      "src/components/documents/document-management.tsx",
      "src/app/api/documents/route.ts",
      "src/app/api/documents/[id]/route.ts",
      "src/app/api/documents/bulk/route.ts"
    ]
  },
  10: {
    name: "Modul Konsultasi Pajak",
    description: "Tax consultation module",
    files: [
      "src/components/consultations/consultation-management.tsx",
      "src/app/api/consultations/route.ts",
      "src/app/api/consultations/[id]/route.ts",
      "src/app/api/consultations/bulk/route.ts"
    ]
  },
  11: {
    name: "Modul Kalkulator Pajak",
    description: "Tax calculator module",
    files: [
      "src/components/tax-calculations/tax-calculator.tsx",
      "src/app/api/tax-calculations/route.ts",
      "src/app/api/tax-calculations/[id]/route.ts",
      "src/app/api/tax-calculations/bulk/route.ts"
    ]
  },
  12: {
    name: "Integrasi Perbankan",
    description: "Banking integration module",
    files: [
      "src/components/bank-integrations/bank-integration.tsx",
      "src/app/api/bank-integrations/route.ts",
      "src/app/api/bank-integrations/[id]/route.ts",
      "src/app/api/bank-integrations/bulk/route.ts",
      "src/app/api/bank-integrations/sync/route.ts"
    ]
  },
  13: {
    name: "Modul Audit dan Compliance",
    description: "Audit and compliance module",
    files: [
      "src/components/audit-compliance/audit-compliance-management.tsx",
      "src/app/api/audits/route.ts",
      "src/app/api/audits/[id]/route.ts",
      "src/app/api/audits/[id]/items/route.ts",
      "src/app/api/compliance-records/route.ts"
    ]
  },
  14: {
    name: "Modul Ekspor Impor",
    description: "Export import module",
    files: [
      // Placeholder for future implementation
    ]
  },
  15: {
    name: "Modul Mobile dan API Eksternal",
    description: "Mobile and external API module",
    files: [
      // Placeholder for future implementation
    ]
  }
};

// Create backup directory if it doesn't exist
const backupDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function createBackup(faseNumber, phaseData) {
  console.log(`Creating backup for Fase ${faseNumber}: ${phaseData.name}`);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupName = `fase-${faseNumber}-complete-${timestamp}`;
  const backupPath = path.join(backupDir, backupName);
  
  // Create directory for this phase backup
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }
  
  // Copy base files for all phases
  const baseFiles = [
    "package.json",
    "tsconfig.json", 
    "tailwind.config.ts",
    "next.config.ts",
    "components.json",
    "eslint.config.mjs",
    "postcss.config.mjs",
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/app/globals.css",
    "src/app/favicon.ico",
    "src/lib/utils.ts",
    "src/lib/db.ts",
    "src/lib/auth.ts",
    "src/lib/socket.ts",
    "prisma/schema.prisma",
    "src/hooks/use-mobile.ts",
    "src/hooks/use-toast.ts"
  ];
  
  // Copy all UI components (they should be available for all phases)
  const uiComponentsPath = "src/components/ui";
  if (fs.existsSync(uiComponentsPath)) {
    const uiFiles = fs.readdirSync(uiComponentsPath);
    baseFiles.push(...uiFiles.map(file => path.join(uiComponentsPath, file)));
  }
  
  // Copy base API routes
  const baseApiRoutes = [
    "src/app/api/health/route.ts",
    "src/app/api/backup/[fase]/route.ts"
  ];
  baseFiles.push(...baseApiRoutes);
  
  // Combine base files with phase-specific files
  const allFiles = [...baseFiles, ...phaseData.files];
  
  // Copy files to backup directory
  for (const file of allFiles) {
    const sourcePath = path.join(process.cwd(), file);
    const destPath = path.join(backupPath, file);
    
    if (fs.existsSync(sourcePath)) {
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(sourcePath, destPath);
      console.log(`  Copied: ${file}`);
    } else {
      console.log(`  Warning: ${file} not found`);
    }
  }
  
  // Create tar.gz file
  const tarFileName = `coretax-fase-${faseNumber}-backup.tar.gz`;
  const tarFilePath = path.join(process.cwd(), tarFileName);
  
  try {
    await tar.create(
      {
        gzip: true,
        file: tarFilePath,
        cwd: backupPath
      },
      ['.']
    );
    console.log(`  Created: ${tarFileName}`);
    
    // Also create a metadata file
    const metadata = {
      fase: faseNumber,
      name: phaseData.name,
      description: phaseData.description,
      timestamp: timestamp,
      files: allFiles.filter(f => fs.existsSync(path.join(process.cwd(), f))),
      totalFiles: allFiles.filter(f => fs.existsSync(path.join(process.cwd(), f))).length
    };
    
    fs.writeFileSync(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
  } catch (error) {
    console.error(`  Error creating tar file: ${error.message}`);
  }
}

async function main() {
  console.log('CoreTax-ID Backup Generator');
  console.log('============================');
  
  for (const [faseNumber, phaseData] of Object.entries(phases)) {
    await createBackup(faseNumber, phaseData);
    console.log(''); // Empty line for readability
  }
  
  console.log('Backup generation completed!');
  console.log('Generated tar.gz files:');
  
  // List generated files
  const files = fs.readdirSync(process.cwd());
  const backupFiles = files.filter(f => f.startsWith('coretax-fase-') && f.endsWith('.tar.gz'));
  
  backupFiles.forEach(file => {
    const stats = fs.statSync(path.join(process.cwd(), file));
    console.log(`  - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  });
}

main().catch(console.error);