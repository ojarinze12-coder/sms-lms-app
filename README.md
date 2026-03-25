# Edunext SMS-LMS

Production-Grade SaaS School Management System + Learning Management System

## Features

- **Multi-tenant Architecture**: Support for multiple schools/institutions
- **Role-Based Access Control (RBAC)**: Strict role-based permissions
- **Academic Structure Management**: Academic years, terms, classes, subjects
- **AI-Powered Features**: Timetable and Exam generation (Gemini AI)
- **Exam Engine**: Timed exams with auto-grading for MCQs
- **Report Cards**: Automated report card generation
- **Background Jobs**: Queue-based job processing
- **Email Notifications**: Professional email system

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: JWT with HTTP-only cookies
- **Jobs**: Upstash Redis (BullMQ)
- **AI**: Gemini AI via Google AI SDK

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Upstash Redis account (for job queue)
- Gemini API key (optional, for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sms-lms
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.local .env
```

Update `.env` with your database URL and other secrets:
```
DATABASE_URL=postgres://user:password@host:5432/database
JWT_SECRET=your-secret-key-min-32-chars
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Push schema to database:
```bash
npx prisma db push
```

6. Seed database with sample data:
```bash
npm run db:seed
```

7. Start development server:
```bash
npm run dev
```

### Default Test Accounts

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@edunext.com | superadmin123 |
| School Admin | admin@demo-school.com | admin123 |
| Teacher | teacher@demo-school.com | teacher123 |

## Project Structure

```
sms-lms/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeder
├── src/
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── (dashboard)/ # Protected dashboard pages
│   │   ├── login/       # Login page
│   │   └── register/   # Registration page
│   ├── components/      # React components
│   ├── lib/            # Utility libraries
│   │   ├── auth.ts     # Authentication utilities
│   │   ├── rbac.ts     # Role-based access control
│   │   └── prisma.ts   # Prisma client
│   └── types/          # TypeScript types
├── .github/workflows/  # CI/CD pipeline
└── package.json
```

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Academic Structure
- `GET /api/sms/academic-years` - List academic years
- `POST /api/sms/academic-years` - Create academic year
- `GET /api/sms/terms` - List terms
- `POST /api/sms/terms` - Create term
- `GET /api/sms/academic-classes` - List classes
- `POST /api/sms/academic-classes` - Create class
- `GET /api/sms/subjects` - List subjects
- `POST /api/sms/subjects` - Create subject

### SMS (School Management)
- `GET /api/sms/students` - List students
- `POST /api/sms/students` - Create student
- `GET /api/sms/teachers` - List teachers
- `POST /api/sms/teachers` - Create teacher

### LMS (Learning Management)
- `GET /api/lms/courses` - List courses
- `POST /api/lms/courses` - Create course
- `GET /api/lms/enrollments` - List enrollments
- `POST /api/lms/enrollments` - Create enrollment

## Role Permissions

| Feature | Super Admin | Admin | Teacher | Student | Parent |
|---------|-------------|-------|---------|---------|--------|
| Manage Tenants | ✓ | - | - | - | - |
| Manage Users | ✓ | ✓ | - | - | - |
| Manage Academics | ✓ | ✓ | - | - | - |
| Create Exams | ✓ | ✓ | ✓ | - | - |
| Take Exams | ✓ | ✓ | - | ✓ | - |
| View Results | ✓ | ✓ | ✓ | ✓ | ✓ |
| AI Generation | ✓ | ✓ | ✓ | - | - |

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables (Production)

```
DATABASE_URL=postgres://...
JWT_SECRET=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_ROOT_DOMAIN=your-domain.com
```

## License

MIT License
