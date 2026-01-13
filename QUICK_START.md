# 🍉 Watermelon Savings - Quick Start Guide

## ✅ What's Already Done

1. ✅ Project structure created
2. ✅ Database set up (SQLite)
3. ✅ Dependencies installed
4. ✅ Development server starting...

## 🚀 Next Steps

### 1. Access Your Application

Once the dev server is running, open your browser and go to:
**http://localhost:3000**

### 2. Create Your First Account

1. Click **"Sign Up"** on the homepage
2. Fill in your details:
   - First Name
   - Last Name
   - Email
   - Password (minimum 6 characters)
   - Phone (optional)
3. Click **"Create Account"**
4. You'll be automatically logged in and redirected to the dashboard!

### 3. Explore the Features

#### **Member Dashboard**
- View your savings balance
- See active loans
- Check recent transactions

#### **Savings Page**
- Make deposits to your savings account
- Withdraw funds (if you have balance)
- View complete transaction history

#### **Loans Page**
- Request a new loan
- View all your loans and their status
- Track repayment progress

#### **Transactions Page**
- See all your financial transactions
- Filter by type (deposits, withdrawals, loans, etc.)

#### **Admin Dashboard** (if you set yourself as admin)
- View total members
- See total savings across all users
- Track pending loan requests
- View overall statistics

### 4. Create an Admin User (Optional)

To access admin features:

**Option 1: Using Prisma Studio**
```bash
npx prisma studio
```
Then:
1. Open http://localhost:5555
2. Go to the User table
3. Find your user and change `role` from `MEMBER` to `ADMIN`

**Option 2: Using SQL (if you have SQLite CLI)**
```sql
UPDATE User SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### 5. Test the Features

Try these workflows:

1. **Deposit Money**
   - Go to Dashboard → Savings
   - Click "Deposit"
   - Enter an amount and description
   - Submit

2. **Request a Loan**
   - Go to Dashboard → Loans
   - Click "Request Loan"
   - Enter loan amount, duration, and interest rate
   - Submit request

3. **View Transactions**
   - All your deposits, withdrawals, and loans appear in Transactions

## 📁 Project Structure

```
watermelon-savings/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── page.tsx          # Homepage
├── components/           # React components
├── lib/                  # Utilities (auth, prisma, utils)
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
└── dev.db                # SQLite database file
```

## 🛠️ Useful Commands

```bash
# Start development server
npm run dev

# Open database viewer
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Build for production
npm run build

# Start production server
npm start
```

## 🎨 Customization Ideas

- **Change colors**: Edit `tailwind.config.ts`
- **Add features**: Create new API routes in `app/api/`
- **Modify UI**: Edit components in `components/` or pages in `app/`
- **Database changes**: Update `prisma/schema.prisma` then run `npx prisma migrate dev`

## 🐛 Troubleshooting

**Port 3000 already in use?**
- Kill the process using port 3000, or
- Change the port: `npm run dev -- -p 3001`

**Database errors?**
- Make sure `dev.db` exists in the project root
- Run `npx prisma generate` to regenerate Prisma Client

**Login not working?**
- Check browser console for errors
- Verify JWT_SECRET is set in `.env`
- Clear browser localStorage and try again

## 📚 Learn More

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

## 🎉 You're Ready!

Your Watermelon Savings application is ready to use. Start by creating an account and exploring all the features!

Happy coding! 🍉
