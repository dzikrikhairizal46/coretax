# 📡 API Overview

## Overview

CoreTax menyediakan RESTful API yang komprehensif untuk mengelola semua aspek sistem manajemen pajak. API dirancang dengan standar industri terbaik, keamanan, dan performa optimal.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.coretax.id`

## Authentication

Semua API endpoints (kecuali auth endpoints) memerlukan authentication menggunakan Bearer token:

```http
Authorization: Bearer <jwt-token>
```

### Login Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "WAJIB_PAJAK",
      "npwp": "01.234.567.8-901.000"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    // Error details (validation errors, etc.)
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## API Endpoints

### 📚 Table of Contents

- [Authentication](#authentication)
- [Dashboard](#dashboard)
- [Tax Calculations](#tax-calculations)
- [SPT Management](#spt-management)
- [Payments](#payments)
- [Documents](#documents)
- [Notifications](#notifications)
- [User Profile](#user-profile)
- [System](#system)

---

## 🔐 Authentication

### POST /api/auth/login
Login user dengan email dan password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "WAJIB_PAJAK",
      "npwp": "01.234.567.8-901.000"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /api/auth/register
Register user baru.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "npwp": "01.234.567.8-901.000",
  "phoneNumber": "+6281234567890",
  "address": "Jl. Example No. 123",
  "company": "PT Example"
}
```

### POST /api/auth/logout
Logout user (invalidate token).

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /api/auth/session
Get current user session.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "WAJIB_PAJAK",
      "npwp": "01.234.567.8-901.000"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📊 Dashboard

### GET /api/dashboard/stats
Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTaxPaid": 150000000,
    "pendingPayments": 25000000,
    "overdueSPT": 3,
    "totalCalculations": 45,
    "recentActivity": [
      {
        "type": "PAYMENT",
        "description": "Payment for PPH 21",
        "amount": 5000000,
        "date": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /api/dashboard/charts
Get chart data for dashboard.

**Query Parameters:**
- `type`: Chart type (revenue, tax-comparison, trends)
- `period`: Period (monthly, quarterly, yearly)
- `year`: Year (default: current year)

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": [
      { "month": "Jan", "amount": 15000000 },
      { "month": "Feb", "amount": 18000000 },
      { "month": "Mar", "amount": 22000000 }
    ],
    "taxComparison": [
      { "type": "PPH_21", "amount": 45000000 },
      { "type": "PPN", "amount": 32000000 },
      { "type": "PPH_23", "amount": 28000000 }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 💰 Tax Calculations

### GET /api/tax/calculations
Get list of tax calculations.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `taxType`: Filter by tax type
- `status`: Filter by status
- `year`: Filter by year
- `search`: Search in description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "calc-123",
      "taxType": "PPH_21",
      "calculationType": "ACTUAL",
      "period": "MONTHLY",
      "year": 2024,
      "grossIncome": 10000000,
      "calculatedTax": 1500000,
      "status": "FINAL",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /api/tax/calculations
Create new tax calculation.

**Request Body:**
```json
{
  "taxType": "PPH_21",
  "calculationType": "ACTUAL",
  "period": "MONTHLY",
  "year": 2024,
  "grossIncome": 10000000,
  "deductibleExpenses": 2000000,
  "taxDeductions": 500000,
  "taxCredits": 0,
  "previousTaxPaid": 0,
  "notes": "Monthly salary tax calculation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "calc-123",
    "taxType": "PPH_21",
    "calculationType": "ACTUAL",
    "period": "MONTHLY",
    "year": 2024,
    "grossIncome": 10000000,
    "taxableIncome": 7500000,
    "taxRate": 0.15,
    "calculatedTax": 1125000,
    "finalTaxAmount": 1125000,
    "status": "FINAL",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /api/tax/calculations/{id}
Get specific tax calculation.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "calc-123",
    "taxType": "PPH_21",
    "calculationType": "ACTUAL",
    "period": "MONTHLY",
    "year": 2024,
    "grossIncome": 10000000,
    "deductibleExpenses": 2000000,
    "taxDeductions": 500000,
    "taxableIncome": 7500000,
    "taxRate": 0.15,
    "calculatedTax": 1125000,
    "finalTaxAmount": 1125000,
    "calculationData": {
      "breakdown": [
        {
          "component": "PPH_21",
          "amount": 1125000,
          "rate": 0.15
        }
      ]
    },
    "status": "FINAL",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### PUT /api/tax/calculations/{id}
Update tax calculation.

### DELETE /api/tax/calculations/{id}
Delete tax calculation.

---

## 📄 SPT Management

### GET /api/spt
Get list of SPT.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Filter by SPT type
- `status`: Filter by status
- `year`: Filter by year

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "spt-123",
      "type": "1770",
      "period": "YEARLY",
      "year": 2024,
      "status": "SUBMITTED",
      "totalTax": 45000000,
      "submittedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /api/spt
Create new SPT.

**Request Body:**
```json
{
  "type": "1770",
  "period": "YEARLY",
  "year": 2024,
  "documentData": {
    "income": 500000000,
    "deductions": 50000000,
    "taxCredits": 10000000
  }
}
```

### POST /api/spt/{id}/submit
Submit SPT to tax authority.

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "SUB-2024-001234",
    "submittedAt": "2024-01-15T10:30:00Z",
    "status": "SUBMITTED"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 💳 Payments

### GET /api/payments
Get list of payments.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status
- `taxType`: Filter by tax type
- `startDate`: Filter by start date
- `endDate`: Filter by end date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "payment-123",
      "taxType": "PPH_21",
      "reference": "PAY-2024-001234",
      "amount": 1500000,
      "paymentMethod": "BANK_TRANSFER",
      "status": "SUCCESS",
      "transactionId": "TXN-123456789",
      "paidAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /api/payments
Create new payment.

**Request Body:**
```json
{
  "taxType": "PPH_21",
  "amount": 1500000,
  "paymentMethod": "BANK_TRANSFER",
  "description": "Monthly tax payment"
}
```

### POST /api/payments/{id}/confirm
Confirm payment status.

---

## 📁 Documents

### GET /api/documents
Get list of documents.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Filter by document type
- `category`: Filter by category

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-123",
      "name": "KTP Scan",
      "type": "IDENTITY",
      "category": "PERSONAL",
      "fileUrl": "https://storage.coretax.id/docs/ktp-123.pdf",
      "fileType": "application/pdf",
      "fileSize": 1024000,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "totalPages": 2
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /api/documents/upload
Upload document.

**Request Body (multipart/form-data):**
```
file: [file]
type: IDENTITY
category: PERSONAL
name: KTP Scan
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-123",
    "name": "KTP Scan",
    "type": "IDENTITY",
    "category": "PERSONAL",
    "fileUrl": "https://storage.coretax.id/docs/ktp-123.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024000,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔔 Notifications

### GET /api/notifications
Get list of notifications.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `isRead`: Filter by read status
- `type`: Filter by notification type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-123",
      "type": "PAYMENT_REMINDER",
      "title": "Payment Reminder",
      "message": "Your PPH 21 payment is due in 3 days",
      "isRead": false,
      "scheduledFor": "2024-01-15T10:30:00Z",
      "sentAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /api/notifications/{id}/read
Mark notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 👤 User Profile

### GET /api/profile
Get user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "WAJIB_PAJAK",
    "npwp": "01.234.567.8-901.000",
    "nik": "1234567890123456",
    "phoneNumber": "+6281234567890",
    "address": "Jl. Example No. 123",
    "company": "PT Example",
    "profile": {
      "businessType": "PERORANGAN",
      "industry": "TEKNOLOGI",
      "taxCategory": "BADAN_USAHA",
      "preferences": {
        "currency": "IDR",
        "language": "id",
        "timezone": "Asia/Jakarta"
      }
    },
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### PUT /api/profile
Update user profile.

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phoneNumber": "+6281234567890",
  "address": "Jl. Example No. 456",
  "company": "PT Example Updated",
  "profile": {
    "businessType": "PERORANGAN",
    "industry": "TEKNOLOGI",
    "preferences": {
      "currency": "IDR",
      "language": "id",
      "timezone": "Asia/Jakarta"
    }
  }
}
```

---

## ⚙️ System

### GET /api/system/health
System health check.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "database": "connected",
    "cache": "connected",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /api/system/info
System information.

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "environment": "production",
    "database": "PostgreSQL 14.0",
    "uptime": 86400,
    "lastDeployed": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🚨 Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 422 | Validation Error - Input validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Maintenance |

## 🔄 Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user
- **File Upload**: 10 uploads per minute per user

## 📝 Versioning

API versioning dilakukan melalui URL path:
- Current version: `/api/v1/`
- Future versions: `/api/v2/`

---

This API documentation provides comprehensive information about all CoreTax API endpoints, request/response formats, authentication, and usage guidelines.