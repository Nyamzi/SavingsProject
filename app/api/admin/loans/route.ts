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

    // Check if user is admin
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all loans with user information
    const loans = await prisma.loan.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const loansData = loans.map((loan) => {
      const principal = Number(loan.amount)
      const interestRate = Number(loan.interestRate)
      const totalExpected = principal + (principal * interestRate / 100)
      
      return {
        id: loan.id,
        userId: loan.userId,
        user: {
          id: loan.user.id,
          email: loan.user.email,
          name: `${loan.user.firstName} ${loan.user.lastName}`,
        },
        amount: loan.amount,
        interestRate: loan.interestRate,
        duration: loan.duration,
        status: loan.status,
        remainingAmount: loan.remainingAmount,
        totalRepaid: loan.totalRepaid,
        totalExpected: totalExpected,
        approvedAt: loan.approvedAt?.toISOString() || null,
        dueDate: loan.dueDate?.toISOString() || null,
        createdAt: loan.createdAt.toISOString(),
      }
    })

    return NextResponse.json(loansData)
  } catch (error) {
    console.error('Admin loans error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
