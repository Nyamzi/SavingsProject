import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { z } from 'zod'

const repaySchema = z.object({
  loanId: z.string().min(1),
  amount: z.coerce.number().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = repaySchema.parse(body)
    const userId = payload.userId
    const repayAmount = Number(validatedData.amount)

    const loan = await prisma.loan.findUnique({
      where: { id: validatedData.loanId },
    })

    if (!loan || loan.userId !== userId) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    if (loan.status !== 'APPROVED' && loan.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Loan is not active for repayment' },
        { status: 400 }
      )
    }

    const totalExpected = Number(loan.amount) + (Number(loan.amount) * Number(loan.interestRate)) / 100
    const remainingBalance = Math.max(0, totalExpected - Number(loan.totalRepaid))

    if (repayAmount > remainingBalance) {
      return NextResponse.json(
        { error: 'Amount exceeds remaining balance' },
        { status: 400 }
      )
    }

    const savings = await prisma.savings.findUnique({
      where: { userId },
    })

    if (!savings) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    if (Number(savings.currentBalance) < repayAmount) {
      return NextResponse.json(
        { error: 'Insufficient current balance' },
        { status: 400 }
      )
    }

    const newTotalRepaid = Number(loan.totalRepaid) + repayAmount
    const newRemaining = Math.max(0, totalExpected - newTotalRepaid)
    const newStatus = newRemaining === 0 ? 'COMPLETED' : 'ACTIVE'

    const updatedLoan = await prisma.loan.update({
      where: { id: loan.id },
      data: {
        remainingAmount: newRemaining,
        totalRepaid: newTotalRepaid,
        status: newStatus,
      },
    })

    await prisma.savings.update({
      where: { userId },
      data: {
        currentBalance: { decrement: repayAmount },
      },
    })

    await prisma.transaction.create({
      data: {
        userId,
        type: 'LOAN_REPAYMENT',
        amount: repayAmount,
        description: 'Loan repayment',
        loanId: loan.id,
      },
    })

    const principal = Number(updatedLoan.amount)
    const interestRate = Number(updatedLoan.interestRate)
    const updatedTotalExpected = principal + (principal * interestRate) / 100

    return NextResponse.json({
      success: true,
      loan: {
        id: updatedLoan.id,
        amount: updatedLoan.amount,
        interestRate: updatedLoan.interestRate,
        duration: updatedLoan.duration,
        status: updatedLoan.status,
        remainingAmount: updatedLoan.remainingAmount,
        totalRepaid: updatedLoan.totalRepaid,
        totalExpected: updatedTotalExpected,
        createdAt: updatedLoan.createdAt.toISOString(),
        approvedAt: updatedLoan.approvedAt?.toISOString() || null,
        dueDate: updatedLoan.dueDate?.toISOString() || null,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Loan repay error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
