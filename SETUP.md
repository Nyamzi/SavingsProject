# Setup Guide for Watermelon Savings

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- npm or yarn package manager

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/watermelon_savings"
JWT_SECRET="your-secret-key-change-in-production-use-a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

**Important:** Replace the `DATABASE_URL` with your actual PostgreSQL connection string and use a strong, random string for `JWT_SECRET` in production.

## Step 3: Set Up the Database

1. Make sure PostgreSQL is running
2. Create a database named `watermelon_savings` (or update the DATABASE_URL accordingly)
3. Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

This will create all the necessary tables in your database.

## Step 4: Generate Prisma Client

```bash
npx prisma generate
```

## Step 5: Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Step 6: Create Your First Account

1. Navigate to the signup page
2. Create an account (this will be a MEMBER by default)
3. To create an admin account, you can either:
   - Update the user role directly in the database
   - Or modify the signup API to allow admin registration (not recommended for production)

## Creating an Admin User

To create an admin user, you can use Prisma Studio:

```bash
npx prisma studio
```

Then navigate to the User table and change a user's role from `MEMBER` to `ADMIN`.

Alternatively, you can run this SQL query in your database:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## Features

- ✅ User authentication (signup/login)
- ✅ Savings account management
- ✅ Deposit and withdrawal functionality
- ✅ Loan request system
- ✅ Transaction history
- ✅ Member dashboard
- ✅ Admin dashboard (for viewing overall statistics)
- ✅ Responsive design

## Next Steps

- Set up production database
- Configure environment variables for production
- Set up SSL certificates
- Configure email service for notifications
- Add loan approval workflow for admins
- Add loan repayment functionality
- Add interest calculation
- Add reporting features
