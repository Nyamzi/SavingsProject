# Database Setup Guide

## PostgreSQL Setup

### Option 1: If PostgreSQL is Already Installed

1. **Find your PostgreSQL connection details:**
   - Default username is usually `postgres`
   - Check your PostgreSQL password (if you set one during installation)
   - Default port is `5432`

2. **Create the database:**
   Open PostgreSQL command line (psql) or pgAdmin and run:
   ```sql
   CREATE DATABASE watermelon_savings;
   ```

3. **Update your `.env` file:**
   Edit the `.env` file and update the `DATABASE_URL` with your actual credentials:
   ```
   DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/watermelon_savings"
   ```

   Example:
   ```
   DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/watermelon_savings"
   ```

### Option 2: Install PostgreSQL (if not installed)

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download the Windows installer
   - Install with default settings
   - Remember the password you set for the `postgres` user

2. **Create the database:**
   ```sql
   CREATE DATABASE watermelon_savings;
   ```

3. **Update `.env` file** with your password:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/watermelon_savings"
   ```

### Option 3: Use a Cloud Database (Alternative)

You can use a free PostgreSQL service like:
- **Supabase**: https://supabase.com (free tier available)
- **Neon**: https://neon.tech (free tier available)
- **Railway**: https://railway.app (free tier available)

Just copy their connection string to your `.env` file.

## After Setting Up Database

Once your `.env` file has the correct DATABASE_URL, run:

```bash
npx prisma migrate dev --name init
```

This will create all the necessary tables in your database.

## Verify Setup

To verify everything is working, you can open Prisma Studio:

```bash
npx prisma studio
```

This will open a web interface at http://localhost:5555 where you can view and manage your database.
