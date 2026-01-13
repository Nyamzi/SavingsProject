# 🍉 Watermelon Savings

A modern, secure savings group management platform built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 👥 **Member Management** - Register and manage savings group members
- 💰 **Savings Tracking** - Track individual and group savings
- 📊 **Loan Management** - Manage loans, repayments, and interest
- 📈 **Dashboard** - Beautiful dashboards for members and admins
- 🔐 **Secure Authentication** - JWT-based authentication system
- 📱 **Responsive Design** - Works seamlessly on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up your database:
```bash
npx prisma migrate dev
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env` file in the root directory:

```
DATABASE_URL="postgresql://user:password@localhost:5432/watermelon_savings"
JWT_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Project Structure

```
watermelon-savings/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── (auth)/         # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   └── layout.tsx      # Root layout
├── components/          # React components
├── lib/                # Utility functions
├── prisma/             # Database schema
└── public/             # Static assets
```

## License

MIT
