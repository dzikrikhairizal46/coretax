# 📚 CoreTax Documentation

Selamat datang di dokumentasi resmi CoreTax! Dokumentasi ini akan membantu Anda memahami, menginstall, dan mengembangkan CoreTax.

## 📋 Table of Contents

### 🚀 Getting Started
- [Installation Guide](deployment/installation.md)
- [Quick Start](deployment/quickstart.md)
- [Environment Setup](deployment/environment.md)

### 🏗️ Architecture
- [System Architecture](architecture/overview.md)
- [Database Schema](architecture/database.md)
- [API Structure](api/overview.md)

### 📖 API Documentation
- [Authentication](api/authentication.md)
- [Tax Calculation API](api/tax-calculation.md)
- [SPT Management API](api/spt-management.md)
- [Payment Integration API](api/payment.md)

### 🎨 Features
- [Dashboard](features/dashboard.md)
- [Tax Calculator](features/tax-calculator.md)
- [SPT Management](features/spt-management.md)
- [Payment System](features/payment.md)
- [Reports & Analytics](features/analytics.md)

### 🚀 Deployment
- [Development Setup](deployment/development.md)
- [Production Deployment](deployment/production.md)
- [Docker Deployment](deployment/docker.md)
- [Vercel Deployment](deployment/vercel.md)

### 🛠️ Development
- [Contributing Guide](../CONTRIBUTING.md)
- [Code Style Guide](development/code-style.md)
- [Testing Guide](development/testing.md)
- [Debugging Guide](development/debugging.md)

### 🔧 Troubleshooting
- [Common Issues](troubleshooting/common-issues.md)
- [Performance Issues](troubleshooting/performance.md)
- [Database Issues](troubleshooting/database.md)

## 🎯 Quick Links

| Section | Description | Link |
|---------|-------------|------|
| **Installation** | How to install CoreTax | [Guide](deployment/installation.md) |
| **API Reference** | Complete API documentation | [API Docs](api/overview.md) |
| **Features** | All CoreTax features explained | [Features](features/dashboard.md) |
| **Deployment** | Deploy to production | [Deploy](deployment/production.md) |
| **Troubleshooting** | Common problems and solutions | [Help](troubleshooting/common-issues.md) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm atau yarn
- Database (SQLite untuk development)

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/coretax.git
cd coretax

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Setup database
npm run db:push

# Start development server
npm run dev
```

### Next Steps
1. [Configure Environment](deployment/environment.md)
2. [Explore Features](features/dashboard.md)
3. [Read API Documentation](api/overview.md)
4. [Deploy to Production](deployment/production.md)

## 🤝 Contributing

Kami sangat welcome kontribusi! Silakan baca [Contributing Guide](../CONTRIBUTING.md) untuk detail panduan kontribusi.

## 📞 Support

Jika Anda membutuhkan bantuan:
- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/coretax/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/yourusername/coretax/discussions)
- **Documentation**: [Browse full documentation](README.md)

## 📄 License

CoreTax is licensed under the MIT License. See [LICENSE](../LICENSE) for more information.

---

<div align="center">

**Made with ❤️ by CoreTax Team**

[![Website](https://img.shields.io/badge/Website-CoreTax-blue)](https://coretax.id)
[![Twitter](https://img.shields.io/badge/Twitter-@CoreTax-blue)](https://twitter.com/coretax)
[![Discord](https://img.shields.io/badge/Discord-Join-purple)](https://discord.gg/coretax)

</div>