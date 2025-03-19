# Medical Records Management System

A comprehensive system for managing medical records, appointments, and patient information.

## Features

- 🏥 Medical Records Management
- 👥 Patient Management
- 👨‍⚕️ Doctor Management
- 📝 Appointment Scheduling
- 📄 Document Management
- 🔒 Role-Based Access Control
- 📊 Audit Logging

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma (PostgreSQL)
- NextAuth.js
- Vercel Blob Storage
- Tailwind CSS
- Radix UI
- Vitest

## Prerequisites

- Node.js 18+
- PostgreSQL
- Vercel Account (for Blob Storage)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/medical-records-system.git
cd medical-records-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/medical_records"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-username"
SMTP_PASSWORD="your-smtp-password"
EMAIL_FROM="noreply@example.com"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your-blob-token"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
.
├── app/                    # Next.js app router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # UI components
│   └── skeletons/        # Loading skeletons
├── lib/                   # Utility functions
├── prisma/               # Database schema
├── public/               # Static files
└── types/                # TypeScript types
```

## Testing

Run the test suite:
```bash
npm test
```

## Development

1. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them:
```bash
git add .
git commit -m "feat: add your feature"
```

3. Push to your branch:
```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request

## Deployment

1. Create a new project on Vercel
2. Connect your repository
3. Configure environment variables
4. Deploy!

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 