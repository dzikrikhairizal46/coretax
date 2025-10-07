# 🤝 Contributing to CoreTax

Kami sangat menghargai kontribusi Anda! CoreTax adalah proyek open-source dan setiap kontribusi membantu membuatnya lebih baik.

## 📋 Table of Contents

- [🚀 Cara Kontribusi](#-cara-kontribusi)
- [📝 Development Workflow](#-development-workflow)
- [🔧 Tech Stack & Requirements](#-tech-stack--requirements)
- [📁 Project Structure](#-project-structure)
- [🎨 Code Style Guidelines](#-code-style-guidelines)
- [🧪 Testing](#-testing)
- [📖 Documentation](#-documentation)
- [🐛 Reporting Issues](#-reporting-issues)
- [🔄 Pull Request Process](#-pull-request-process)
- [🏷️ Commit Message Guidelines](#-commit-message-guidelines)

---

## 🚀 Cara Kontribusi

### 1. **Find Something to Work On**
- Cek [Issues](https://github.com/yourusername/coretax/issues) untuk bugs dan feature requests
- Lihat [Good First Issue](https://github.com/yourusername/coretax/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) untuk pemula
- Explore [Roadmap](ROADMAP.md) untuk fitur yang akan datang

### 2. **Setup Development Environment**
```bash
# Fork dan clone repository
git clone https://github.com/YOUR_USERNAME/coretax.git
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

### 3. **Create Your Branch**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Atau untuk bug fixes
git checkout -b fix/your-fix-name
```

---

## 📝 Development Workflow

### 1. **Planning**
- Diskusikan ide Anda di [Discussions](https://github.com/yourusername/coretax/discussions)
- Buat issue untuk tracking progress
- Tunggu approval dari maintainers sebelum mulai coding

### 2. **Development**
```bash
# Sync dengan main branch
git fetch upstream
git rebase upstream/main

# Buat perubahan Anda
# ... coding ...

# Test perubahan Anda
npm run test
npm run lint
npm run type-check

# Commit perubahan
git add .
git commit -m "feat: add amazing feature"
```

### 3. **Submit Pull Request**
```bash
# Push ke fork Anda
git push origin feature/your-feature-name

# Buat Pull Request di GitHub
# Link ke issue yang terkait
# Tambahkan screenshots jika perlu
```

---

## 🔧 Tech Stack & Requirements

### Required
- **Node.js**: 18.0 atau lebih tinggi
- **npm**: 8.0 atau lebih tinggi
- **Git**: 2.0 atau lebih tinggi

### Development Tools
```json
{
  "dependencies": {
    "next": "15.0.0",
    "react": "18.0.0",
    "typescript": "5.0.0"
  },
  "devDependencies": {
    "@types/node": "20.0.0",
    "@types/react": "18.0.0",
    "eslint": "8.0.0",
    "prettier": "3.0.0"
  }
}
```

---

## 📁 Project Structure

```
coretax/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── (auth)/           # Auth pages
│   │   ├── dashboard/        # Dashboard pages
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── forms/           # Form components
│   │   └── charts/          # Chart components
│   ├── lib/                 # Utilities and configs
│   │   ├── auth.ts          # Authentication
│   │   ├── db.ts            # Database
│   │   └── utils.ts         # Helper functions
│   └── types/               # TypeScript definitions
├── prisma/                  # Database schema
├── public/                  # Static assets
├── docs/                    # Documentation
└── tests/                   # Test files
```

---

## 🎨 Code Style Guidelines

### TypeScript
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

const getUser = async (id: string): Promise<User | null> => {
  try {
    const user = await db.user.findUnique({ where: { id } });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// ❌ Bad
interface user {
  id: string;
  email: string;
}

const getUser = (id) => {
  return db.user.findUnique({ where: { id } });
};
```

### React Components
```tsx
// ✅ Good
interface DashboardCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  trend = 'stable'
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold">
            {formatCurrency(value)}
          </p>
        </div>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </div>
    </Card>
  );
};

// ❌ Bad
export default function DashboardCard(props) {
  return (
    <div className="p-6 border rounded-lg">
      <h3>{props.title}</h3>
      <p>{props.value}</p>
    </div>
  );
}
```

### API Routes
```typescript
// ✅ Good
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createTaxCalculationSchema = z.object({
  taxType: z.enum(['PPH_21', 'PPN', 'PPH_23']),
  grossIncome: z.number().positive(),
  year: z.number().min(2000).max(new Date().getFullYear() + 1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTaxCalculationSchema.parse(body);
    
    // Process data...
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ❌ Bad
export async function POST(request) {
  const body = await request.json();
  
  if (!body.taxType || !body.grossIncome) {
    return Response.json({ error: 'Missing fields' });
  }
  
  // Process without validation...
}
```

---

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test DashboardCard.test.tsx

# Watch mode for development
npm run test:watch
```

### Writing Tests
```typescript
// ✅ Good test example
import { render, screen } from '@testing-library/react';
import { DashboardCard } from '@/components/DashboardCard';
import { TrendingUp } from 'lucide-react';

describe('DashboardCard', () => {
  const defaultProps = {
    title: 'Total Pajak',
    value: 10000000,
    icon: <TrendingUp className="h-4 w-4" />,
  };

  it('renders card with title and value', () => {
    render(<DashboardCard {...defaultProps} />);
    
    expect(screen.getByText('Total Pajak')).toBeInTheDocument();
    expect(screen.getByText('Rp 10.000.000')).toBeInTheDocument();
  });

  it('displays icon correctly', () => {
    render(<DashboardCard {...defaultProps} />);
    
    const icon = screen.getByTestId('dashboard-card-icon');
    expect(icon).toBeInTheDocument();
  });

  it('applies trend styling', () => {
    render(<DashboardCard {...defaultProps} trend="up" />);
    
    const trendIndicator = screen.getByTestId('trend-indicator');
    expect(trendIndicator).toHaveClass('text-green-500');
  });
});
```

---

## 📖 Documentation

### Adding Documentation
- Update README.md untuk fitur baru
- Tambahkan dokumentasi di `docs/` folder
- Update JSDoc comments untuk fungsi kompleks
- Sertakan screenshots untuk UI changes

### Documentation Structure
```
docs/
├── api/                    # API documentation
├── deployment/            # Deployment guides
├── features/              # Feature documentation
├── screenshots/           # UI screenshots
└── troubleshooting/       # Troubleshooting guides
```

---

## 🐛 Reporting Issues

### Creating Good Issues
Gunakan template issue:

```markdown
## 🐛 Bug Description
Deskripsi singkat bug yang ditemukan

## 🔄 Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## 🖥️ Environment
- OS: [e.g. Ubuntu 20.04]
- Browser: [e.g. Chrome 96]
- Node.js: [e.g. 18.0.0]
- CoreTax: [e.g. v1.0.0]

## 📝 Expected Behavior
Apa yang seharusnya terjadi

## 📸 Screenshots
Jika applicable, tambahkan screenshots

## 📋 Additional Context
Tambahkan context tambahan tentang problem
```

### Feature Request Template
```markdown
## 🚀 Feature Description
Deskripsi fitur yang diinginkan

## 🎯 Problem Statement
Problem apa yang ingin diselesaikan

## 💡 Proposed Solution
Solusi yang diusulkan

## 🎨 Design Ideas
Sketch atau design ideas

## 📊 Impact Assessment
Impact terhadap user experience dan system

## 🔧 Implementation Details
Technical implementation details
```

---

## 🔄 Pull Request Process

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review of code telah dilakukan
- [ ] Documentation telah diupdate
- [ ] Tests telah ditambahkan/updated
- [ ] No breaking changes
- [ ] All tests passing
- [ ] Linting passes

### PR Template
```markdown
## 🔄 Changes
Deskripsi perubahan yang dibuat

## 🎯 Type of Change
- [ ] Bug fix (non-breaking change yang fixes issue)
- [ ] New feature (non-breaking change yang menambah functionality)
- [ ] Breaking change (fix atau feature yang menyebabkan breaking change)
- [ ] Documentation update

## ✅ Checklist
- [ ] My code follows style guidelines
- [ ] Saya telah melakukan self-review
- [ ] Saya telah mengupdate documentation
- [ ] Saya telah menambah tests
- [ ] New dan existing unit tests pass

## 📸 Screenshots (jika applicable)
Tambahkan screenshots untuk UI changes

## 🐛 Related Issues
Closes #123
Related to #456

## 🔄 Testing
Describe testing yang telah dilakukan
```

---

## 🏷️ Commit Message Guidelines

Gunakan [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: Fitur baru
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `test`: Adding atau modifying tests
- `chore`: Maintenance tasks

### Examples
```bash
# ✅ Good commits
feat: add tax calculator for PPH 21
fix: resolve authentication redirect loop
docs: update API documentation
style: format code with prettier
refactor: extract user service to separate module
test: add unit tests for dashboard components
chore: upgrade dependencies to latest versions

# ❌ Bad commits
fixed bug
update docs
stuff
wip
```

### Commit with Scope
```bash
feat(auth): add OAuth integration
fix(dashboard): resolve chart rendering issue
docs(api): update endpoint documentation
```

### Commit with Breaking Changes
```bash
feat: add new tax calculation engine

BREAKING CHANGE: The old calculation engine has been removed.
All integrations must be updated to use the new API.
```

---

## 🎉 Getting Help

### Resources
- [Documentation](docs/)
- [API Reference](docs/api/)
- [Discussions](https://github.com/yourusername/coretax/discussions)
- [Issues](https://github.com/yourusername/coretax/issues)

### Contact
- **Discord**: [Join our Discord server](https://discord.gg/coretax)
- **Email**: [coretax@example.com](mailto:coretax@example.com)
- **Twitter**: [@CoreTax](https://twitter.com/coretax)

---

Terima kasih atas kontribusi Anda! 🙏