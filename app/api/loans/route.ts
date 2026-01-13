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

    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      loans.map((loan) => {
        const principal = Number(loan.amount)
        const interestRate = Number(loan.interestRate)
        const totalExpected = principal + (principal * interestRate / 100)
        
        return {
          id: loan.id,
          amount: loan.amount,
          interestRate: loan.interestRate,
          duration: loan.duration,
          status: loan.status,
          remainingAmount: loan.remainingAmount,
          totalRepaid: loan.totalRepaid,
          totalExpected: totalExpected,
          createdAt: loan.createdAt.toISOString(),
          approvedAt: loan.approvedAt?.toISOString() || null,
          dueDate: loan.dueDate?.toISOString() || null,
        }
      })
    )
  } catch (error) {
    console.error('Loans fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
