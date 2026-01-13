import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { z } from 'zod'

const depositSchema = z.object({
  amount: z.string().refine((val) => parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
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
    const validatedData = depositSchema.parse(body)
    const amount = parseFloat(validatedData.amount)
    const userId = payload.userId

    // Update savings account
    const savings = await prisma.savings.findUnique({
      where: { userId },
    })

    if (!savings) {
      return NextResponse.json({ error: 'Savings account not found' }, { status: 404 })
    }

    await prisma.savings.update({
      where: { userId },
      data: {
        currentBalance: { increment: amount },
        totalDeposits: { increment: amount },
      },
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        amount,
        description: validatedData.description || 'Deposit',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Deposit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
