import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { z } from 'zod'

// Zod schema for repayment
const repaySchema = z.object({
  loanId: z.string(),
  amount: z.number().positive(),
})

export async function POST(request: NextRequest) {
  try {
    // ----- 1. Authenticate user -----
    const token = getTokenFromRequest(request)
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const userId = payload.userId

    // ----- 2. Validate request body -----
    const body = await request.json()
    const { loanId, amount } = repaySchema.parse(body)

    // ----- 3. Fetch loan -----
    const loan = await prisma.loan.findUnique({ where: { id: loanId } })
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })

    if (loan.userId !== userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (loan.status === 'REJECTED')
      return NextResponse.json({ error: 'Cannot repay a rejected loan' }, { status: 400 })

    if (amount > loan.remainingAmount)
      return NextResponse.json({ error: 'Repayment exceeds remaining balance' }, { status: 400 })

    // ----- 4. Calculate totals -----
    const totalExpected = loan.amount + (loan.amount * (loan.interestRate / 100))
    const newTotalRepaid = loan.totalRepaid + amount
    const newRemaining = Math.max(0, totalExpected - newTotalRepaid)

    // ----- 5. Update loan -----
    const updatedLoan = await prisma.loan.update({
      where: { id: loan.id },
      data: {
        totalRepaid: newTotalRepaid,
        remainingAmount: newRemaining,
        status: newRemaining === 0 ? 'COMPLETED' : loan.status,
        updatedAt: new Date(),
      },
    })

    // ----- 6. Create transaction -----
    await prisma.transaction.create({
      data: {
        userId,
        loanId: loan.id,
        type: 'LOAN_REPAYMENT',
        amount,
        description: `Repayment for loan ${loan.id}`,
      },
    })

    // ----- 7. Return updated loan -----
    return NextResponse.json({ success: true, loan: updatedLoan })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })

    console.error('Repay loan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
