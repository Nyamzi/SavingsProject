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

    // Get all members with their savings and loans
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      include: {
        savings: true,
        loans: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get all savings accounts
    const allSavings = await prisma.savings.findMany({
      where: {
        userId: { in: members.map(m => m.id) },
      },
    })

    // Create a map of userId to savings
    const savingsMap = new Map(allSavings.map(s => [s.userId, s]))

    const membersData = members.map((member) => {
      const savings = savingsMap.get(member.id)
      const userLoans = member.loans || []
      const totalLoans = userLoans.reduce((sum, loan) => sum + Number(loan.amount), 0)
      const activeLoans = userLoans.filter(
        (loan) => loan.status === 'ACTIVE' || loan.status === 'APPROVED'
      ).length
      const totalRepaid = userLoans.reduce((sum, loan) => sum + Number(loan.totalRepaid), 0)

      return {
        id: member.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        createdAt: member.createdAt.toISOString(),
        savings: {
          amount: savings?.amount || 0,
          currentBalance: savings?.currentBalance || 0,
          totalDeposits: savings?.totalDeposits || 0,
          totalWithdrawals: savings?.totalWithdrawals || 0,
        },
        loans: {
          total: totalLoans,
          active: activeLoans,
          totalRepaid: totalRepaid,
          count: userLoans.length,
        },
      }
    })

    return NextResponse.json(membersData)
  } catch (error) {
    console.error('Admin members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
