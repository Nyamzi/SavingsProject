import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.userId

    // Get user's savings
    const savings = await prisma.savings.findUnique({
      where: { userId },
    })

    // Get user's loans
    const loans = await prisma.loan.findMany({
      where: { userId },
    })

    const activeLoans = loans.filter(
      (loan) => loan.status === 'ACTIVE' || loan.status === 'APPROVED'
    ).length

    const totalLoans = loans.reduce((sum, loan) => sum + Number(loan.amount), 0)

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({
      totalSavings: savings?.amount || 0,
      currentBalance: savings?.currentBalance || 0,
      totalLoans,
      activeLoans,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
