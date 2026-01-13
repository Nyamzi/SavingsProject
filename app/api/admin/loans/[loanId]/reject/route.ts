import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { loanId: string } }
) {
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

    const loanId = params.loanId

    // Find the loan
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    })

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    if (loan.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Loan is not pending approval' },
        { status: 400 }
      )
    }

    // Reject the loan
    const rejectedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'REJECTED',
      },
    })

    return NextResponse.json({
      success: true,
      loan: {
        id: rejectedLoan.id,
        status: rejectedLoan.status,
      },
    })
  } catch (error) {
    console.error('Loan rejection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
