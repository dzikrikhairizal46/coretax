# 🗄️ Database Schema

## Overview

CoreTax menggunakan Prisma ORM dengan database SQLite untuk development dan PostgreSQL untuk production. Schema dirancang untuk mendukung manajemen pajak yang komprehensif dengan data integrity dan performance optimal.

## Database Schema

```mermaid
erDiagram
    Users ||--o{ TaxCalculations : has
    Users ||--o{ SPT : files
    Users ||--o{ Payments : makes
    Users ||--o{ Documents : owns
    Users ||--o{ Notifications : receives
    Users ||--o{ Profiles : has
    Users ||--o{ AuditLogs : creates
    
    TaxCalculations ||--o{ TaxBreakdown : contains
    SPT ||--o{ SPTDocuments : contains
    Payments ||--o{ PaymentReceipts : has
    Documents ||--o{ DocumentVersions : has
    
    Users {
        string id PK
        string email UK
        string name
        string password
        string role
        string npwp UK
        string nik
        string phoneNumber
        string address
        string company
        boolean isActive
        boolean emailVerified
        datetime createdAt
        datetime updatedAt
    }
    
    TaxCalculations {
        string id PK
        string userId FK
        string taxType
        string calculationType
        string period
        integer year
        decimal grossIncome
        decimal deductibleExpenses
        decimal taxDeductions
        decimal taxCredits
        decimal previousTaxPaid
        decimal taxableIncome
        decimal taxRate
        decimal calculatedTax
        decimal finalTaxAmount
        json calculationData
        string notes
        string status
        datetime createdAt
        datetime updatedAt
    }
    
    SPT {
        string id PK
        string userId FK
        string type
        string period
        integer year
        string status
        decimal totalTax
        json documentData
        string submissionId
        datetime submittedAt
        datetime createdAt
        datetime updatedAt
    }
    
    Payments {
        string id PK
        string userId FK
        string taxType
        string reference
        decimal amount
        string paymentMethod
        string status
        string transactionId
        datetime paidAt
        datetime createdAt
        datetime updatedAt
    }
    
    Documents {
        string id PK
        string userId FK
        string name
        string type
        string category
        string fileUrl
        string fileType
        integer fileSize
        json metadata
        datetime createdAt
        datetime updatedAt
    }
    
    Notifications {
        string id PK
        string userId FK
        string type
        string title
        string message
        boolean isRead
        datetime scheduledFor
        datetime sentAt
        datetime readAt
        datetime createdAt
        datetime updatedAt
    }
    
    Profiles {
        string id PK
        string userId FK UK
        string businessType
        string industry
        string taxCategory
        json preferences
        json settings
        datetime createdAt
        datetime updatedAt
    }
    
    AuditLogs {
        string id PK
        string userId FK
        string action
        string entityType
        string entityId
        json oldValues
        json newValues
        string ipAddress
        string userAgent
        datetime createdAt
    }
    
    TaxBreakdown {
        string id PK
        string calculationId FK
        string component
        decimal amount
        decimal rate
        json details
        datetime createdAt
    }
    
    SPTDocuments {
        string id PK
        string sptId FK
        string documentId FK
        string documentType
        json documentData
        datetime createdAt
    }
    
    PaymentReceipts {
        string id PK
        string paymentId FK
        string receiptUrl
        string receiptNumber
        json receiptData
        datetime createdAt
    }
    
    DocumentVersions {
        string id PK
        string documentId FK
        integer version
        string fileUrl
        integer fileSize
        string changeReason
        datetime createdAt
    }
```

## Table Definitions

### Users
Tabel utama untuk menyimpan data pengguna sistem.

```sql
CREATE TABLE Users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    npwp TEXT UNIQUE,
    nik TEXT,
    phoneNumber TEXT,
    address TEXT,
    company TEXT,
    isActive BOOLEAN DEFAULT true,
    emailVerified BOOLEAN DEFAULT false,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Unique identifier untuk user
- `email`: Email user (unique)
- `name`: Nama lengkap user
- `password`: Hashed password
- `role`: Role user (ADMIN, WAJIB_PAJAK, KONSULTAN)
- `npwp`: Nomor Pokok Wajib Pajak (unique)
- `nik`: Nomor Induk Kependudukan
- `phoneNumber`: Nomor telepon
- `address`: Alamat lengkap
- `company`: Nama perusahaan (untuk corporate user)
- `isActive`: Status aktif user
- `emailVerified`: Status verifikasi email

### TaxCalculations
Tabel untuk menyimpan hasil perhitungan pajak.

```sql
CREATE TABLE TaxCalculations (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    taxType TEXT NOT NULL,
    calculationType TEXT NOT NULL,
    period TEXT NOT NULL,
    year INTEGER NOT NULL,
    grossIncome DECIMAL(15,2) NOT NULL,
    deductibleExpenses DECIMAL(15,2) DEFAULT 0,
    taxDeductions DECIMAL(15,2) DEFAULT 0,
    taxCredits DECIMAL(15,2) DEFAULT 0,
    previousTaxPaid DECIMAL(15,2) DEFAULT 0,
    taxableIncome DECIMAL(15,2) NOT NULL,
    taxRate DECIMAL(5,4) NOT NULL,
    calculatedTax DECIMAL(15,2) NOT NULL,
    finalTaxAmount DECIMAL(15,2) NOT NULL,
    calculationData JSON,
    notes TEXT,
    status TEXT DEFAULT 'DRAFT',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
);
```

**Fields:**
- `taxType`: Jenis pajak (PPH_21, PPN, PPH_23, etc.)
- `calculationType`: Tipe perhitungan (ESTIMATE, ACTUAL, ADJUSTMENT)
- `period`: Periode perhitungan (MONTHLY, QUARTERLY, YEARLY)
- `year`: Tahun pajak
- `grossIncome`: Penghasilan kotor
- `taxableIncome`: Penghasilan kena pajak
- `taxRate`: Tarif pajak
- `calculatedTax`: Pajak dihitung
- `finalTaxAmount`: Jumlah pajak final
- `calculationData`: Detail perhitungan dalam JSON
- `status`: Status perhitungan (DRAFT, FINAL, CANCELLED)

### SPT
Tabel untuk menyimpan data Surat Pemberitahuan Tahunan/Masaan.

```sql
CREATE TABLE SPT (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    period TEXT NOT NULL,
    year INTEGER NOT NULL,
    status TEXT DEFAULT 'DRAFT',
    totalTax DECIMAL(15,2) DEFAULT 0,
    documentData JSON,
    submissionId TEXT,
    submittedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
);
```

**Fields:**
- `type`: Jenis SPT (1770, 1770S, 1771, etc.)
- `period`: Periode SPT
- `year`: Tahun pajak
- `status`: Status SPT (DRAFT, SUBMITTED, APPROVED, REJECTED)
- `totalTax`: Total jumlah pajak
- `documentData`: Data dokumen SPT dalam JSON
- `submissionId`: ID submission dari DJP
- `submittedAt`: Tanggal submit

### Payments
Tabel untuk menyimpan data pembayaran pajak.

```sql
CREATE TABLE Payments (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    taxType TEXT NOT NULL,
    reference TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    paymentMethod TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    transactionId TEXT,
    paidAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
);
```

**Fields:**
- `reference`: Nomor referensi pembayaran
- `amount`: Jumlah pembayaran
- `paymentMethod`: Metode pembayaran (BANK_TRANSFER, VA, etc.)
- `status`: Status pembayaran (PENDING, SUCCESS, FAILED)
- `transactionId`: ID transaksi dari payment gateway
- `paidAt`: Tanggal pembayaran

## Indexes

Untuk performa optimal, berikut adalah indexes yang didefinisikan:

```sql
-- User indexes
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_npwp ON Users(npwp);
CREATE INDEX idx_users_role ON Users(role);
CREATE INDEX idx_users_active ON Users(isActive);

-- Tax calculation indexes
CREATE INDEX idx_tax_calculations_user ON TaxCalculations(userId);
CREATE INDEX idx_tax_calculations_type ON TaxCalculations(taxType);
CREATE INDEX idx_tax_calculations_year ON TaxCalculations(year);
CREATE INDEX idx_tax_calculations_status ON TaxCalculations(status);
CREATE INDEX idx_tax_calculations_period ON TaxCalculations(period, year);

-- SPT indexes
CREATE INDEX idx_spt_user ON SPT(userId);
CREATE INDEX idx_spt_type ON SPT(type);
CREATE INDEX idx_spt_year ON SPT(year);
CREATE INDEX idx_spt_status ON SPT(status);
CREATE INDEX idx_spt_submission ON SPT(submissionId);

-- Payment indexes
CREATE INDEX idx_payments_user ON Payments(userId);
CREATE INDEX idx_payments_status ON Payments(status);
CREATE INDEX idx_payments_method ON Payments(paymentMethod);
CREATE INDEX idx_payments_transaction ON Payments(transactionId);

-- Notification indexes
CREATE INDEX idx_notifications_user ON Notifications(userId);
CREATE INDEX idx_notifications_status ON Notifications(isRead);
CREATE INDEX idx_notifications_scheduled ON Notifications(scheduledFor);

-- Audit log indexes
CREATE INDEX idx_audit_user ON AuditLogs(userId);
CREATE INDEX idx_audit_action ON AuditLogs(action);
CREATE INDEX idx_audit_entity ON AuditLogs(entityType, entityId);
CREATE INDEX idx_audit_created ON AuditLogs(createdAt);
```

## Relationships

### One-to-Many Relationships
- **Users → TaxCalculations**: Satu user bisa memiliki banyak perhitungan pajak
- **Users → SPT**: Satu user bisa memiliki banyak SPT
- **Users → Payments**: Satu user bisa melakukan banyak pembayaran
- **Users → Documents**: Satu user bisa mengupload banyak dokumen
- **Users → Notifications**: Satu user bisa menerima banyak notifikasi

### Many-to-Many Relationships
- **SPT ↔ Documents**: SPT bisa memiliki banyak dokumen, dokumen bisa dimiliki banyak SPT (melalui SPTDocuments)

### Data Integrity Constraints
```sql
-- Foreign key constraints
ALTER TABLE TaxCalculations ADD CONSTRAINT fk_tax_user 
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE;

ALTER TABLE SPT ADD CONSTRAINT fk_spt_user 
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE;

ALTER TABLE Payments ADD CONSTRAINT fk_payment_user 
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE;

ALTER TABLE Documents ADD CONSTRAINT fk_document_user 
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE;

ALTER TABLE Notifications ADD CONSTRAINT fk_notification_user 
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE;

-- Check constraints
ALTER TABLE Users ADD CONSTRAINT chk_user_role 
    CHECK (role IN ('ADMIN', 'WAJIB_PAJAK', 'KONSULTAN'));

ALTER TABLE TaxCalculations ADD CONSTRAINT chk_tax_type 
    CHECK (taxType IN ('PPH_21', 'PPN', 'PPH_23', 'PPH_25', 'PBB', 'BPHTB', 'PAJAK_KENDARAAN'));

ALTER TABLE TaxCalculations ADD CONSTRAINT chk_calculation_type 
    CHECK (calculationType IN ('ESTIMATE', 'ACTUAL', 'ADJUSTMENT'));

ALTER TABLE TaxCalculations ADD CONSTRAINT chk_calculation_status 
    CHECK (status IN ('DRAFT', 'FINAL', 'CANCELLED'));

ALTER TABLE SPT ADD CONSTRAINT chk_spt_type 
    CHECK (type IN ('1770', '1770S', '1771'));

ALTER TABLE SPT ADD CONSTRAINT chk_spt_status 
    CHECK (status IN ('DRAFT', 'SUBMITTED', APPROVED', 'REJECTED'));

ALTER TABLE Payments ADD CONSTRAINT chk_payment_status 
    CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'));
```

## Data Migration Strategy

### Version Control
- Semua perubahan schema menggunakan Prisma migrations
- Migrations di-commit ke version control
- Rollback capability untuk setiap migration

### Production Deployment
1. Generate migration: `npx prisma migrate dev --name migration_name`
2. Review generated SQL
3. Test migration di staging environment
4. Apply migration ke production: `npx prisma migrate deploy`

### Data Seeding
```sql
-- Sample data for development
INSERT INTO Users (id, email, name, password, role, npwp, isActive, emailVerified) 
VALUES 
    ('user-1', 'admin@coretax.id', 'Administrator', 'hashed_password', 'ADMIN', '01.234.567.8-901.000', true, true),
    ('user-2', 'user@example.com', 'John Doe', 'hashed_password', 'WAJIB_PAJAK', '01.234.567.8-902.000', true, true),
    ('user-3', 'konsultan@example.com', 'Jane Smith', 'hashed_password', 'KONSULTAN', '01.234.567.8-903.000', true, true);

-- Sample tax calculations
INSERT INTO TaxCalculations (id, userId, taxType, calculationType, period, year, grossIncome, taxableIncome, taxRate, calculatedTax, finalTaxAmount, status) 
VALUES 
    ('calc-1', 'user-2', 'PPH_21', 'ACTUAL', 'MONTHLY', 2024, 10000000, 8000000, 0.15, 1200000, 1200000, 'FINAL'),
    ('calc-2', 'user-2', 'PPN', 'ACTUAL', 'MONTHLY', 2024, 50000000, 50000000, 0.11, 5500000, 5500000, 'FINAL');
```

## Performance Considerations

### Query Optimization
- Gunakan indexes untuk kolom yang sering di-query
- Hindari SELECT * di production
- Gunakan pagination untuk data yang besar
- Implement query caching

### Database Connection Pooling
```javascript
// Prisma configuration with connection pooling
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  connectionPool: {
    min: 2,
    max: 10,
  },
});
```

### Backup Strategy
- Daily automated backups
- Point-in-time recovery capability
- Off-site backup storage
- Regular backup testing

## Security Considerations

### Data Encryption
- Sensitive data encryption at rest
- SSL/TLS for data in transit
- Secure password hashing

### Access Control
- Role-based access control
- Row-level security for sensitive data
- Audit logging for all data access

### Data Retention
- Define data retention policies
- Automated data archival
- Secure data deletion procedures

---

This database schema provides a solid foundation for the CoreTax application, ensuring data integrity, performance, and security while supporting all tax management features.