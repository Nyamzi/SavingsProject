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

    const savings = await prisma.savings.findUnique({
      where: { userId },
    })

    if (!savings) {
      return NextResponse.json({ error: 'Savings account not found' }, { status: 404 })
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ['DEPOSIT', 'WITHDRAWAL'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      amount: savings.amount, // Savings balance
      currentBalance: savings.currentBalance, // Current/checking balance
      totalDeposits: savings.totalDeposits,
      totalWithdrawals: savings.totalWithdrawals,
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Savings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
