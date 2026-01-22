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

    // Calculate due date (duration in months from now)
    const dueDate = new Date()
    dueDate.setMonth(dueDate.getMonth() + loan.duration)

    // Get user's savings account
    const savings = await prisma.savings.findUnique({
      where: { userId: loan.userId },
    })

    if (!savings) {
      return NextResponse.json({ error: 'User savings account not found' }, { status: 404 })
    }

    const totalExpected =
      Number(loan.amount) + (Number(loan.amount) * Number(loan.interestRate)) / 100

    // Approve the loan and add loan amount to current balance
    const approvedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        dueDate: dueDate,
        remainingAmount: totalExpected,
      },
    })

    // Add loan amount to user's current balance
    await prisma.savings.update({
      where: { userId: loan.userId },
      data: {
        currentBalance: { increment: loan.amount },
      },
    })

    // Create transaction record for loan disbursement
    await prisma.transaction.create({
      data: {
        userId: loan.userId,
        type: 'LOAN',
        amount: loan.amount,
        description: 'Loan approved and disbursed',
        loanId: loan.id,
      },
    })

    return NextResponse.json({
      success: true,
      loan: {
        id: approvedLoan.id,
        status: approvedLoan.status,
        approvedAt: approvedLoan.approvedAt?.toISOString(),
        dueDate: approvedLoan.dueDate?.toISOString(),
      },
    })
  } catch (error) {
    console.error('Loan approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
