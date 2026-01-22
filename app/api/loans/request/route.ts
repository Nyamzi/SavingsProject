import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { z } from 'zod'

const loanRequestSchema = z.object({
  amount: z.coerce.number().positive(),
  duration: z.coerce.number().int().positive(),
  interestRate: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
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
    const validatedData = loanRequestSchema.parse(body)
    const userId = payload.userId

    const amount = Number(validatedData.amount)
    const duration = Number(validatedData.duration)
    const interestRate = Number(validatedData.interestRate ?? 5)

    const totalExpected = amount + (amount * interestRate) / 100

    // Create loan request
    const loan = await prisma.loan.create({
      data: {
        userId,
        amount,
        interestRate,
        duration,
        status: 'PENDING',
        remainingAmount: totalExpected,
      },
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId,
        type: 'LOAN',
        amount,
        description: validatedData.description || 'Loan request',
        loanId: loan.id,
      },
    })

    return NextResponse.json({ success: true, loan })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Loan request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
