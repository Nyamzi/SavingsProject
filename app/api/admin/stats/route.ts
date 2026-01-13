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

    // Get total members
    const totalMembers = await prisma.user.count({
      where: { role: 'MEMBER' },
    })

    // Get total savings
    const allSavings = await prisma.savings.findMany()
    const totalSavings = allSavings.reduce(
      (sum, savings) => sum + Number(savings.amount),
      0
    )

    // Get total deposits
    const totalDeposits = allSavings.reduce(
      (sum, savings) => sum + Number(savings.totalDeposits),
      0
    )

    // Get all loans
    const allLoans = await prisma.loan.findMany()
    const totalLoans = allLoans.reduce(
      (sum, loan) => sum + Number(loan.amount),
      0
    )
    const totalRepaid = allLoans.reduce(
      (sum, loan) => sum + Number(loan.totalRepaid),
      0
    )

    // Calculate revenue from loans (interest earned)
    const approvedLoans = allLoans.filter(
      (loan) => loan.status === 'APPROVED' || loan.status === 'ACTIVE'
    )
    const totalInterestEarned = approvedLoans.reduce((sum, loan) => {
      const interestAmount = (Number(loan.amount) * Number(loan.interestRate)) / 100
      return sum + interestAmount
    }, 0)

    // Calculate actual interest collected (from repaid loans)
    const repaidLoans = allLoans.filter((loan) => Number(loan.totalRepaid) > 0)
    const interestCollected = repaidLoans.reduce((sum, loan) => {
      const repaidRatio = Number(loan.totalRepaid) / Number(loan.amount)
      const totalInterest = (Number(loan.amount) * Number(loan.interestRate)) / 100
      return sum + (totalInterest * repaidRatio)
    }, 0)

    // Get pending loans
    const pendingLoans = await prisma.loan.count({
      where: { status: 'PENDING' },
    })

    // Get active loans
    const activeLoans = await prisma.loan.count({
      where: { status: { in: ['ACTIVE', 'APPROVED'] } },
    })

    // Get completed loans
    const completedLoans = await prisma.loan.count({
      where: { status: 'COMPLETED' },
    })

    return NextResponse.json({
      totalMembers,
      totalSavings,
      totalDeposits,
      totalLoans,
      totalRepaid,
      totalInterestEarned,
      interestCollected,
      pendingLoans,
      activeLoans,
      completedLoans,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
