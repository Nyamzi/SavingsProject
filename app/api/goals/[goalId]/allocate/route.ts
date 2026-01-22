import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { z } from 'zod'

const allocateSchema = z.object({
  amount: z.coerce.number().positive(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { goalId: string } }
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

    const body = await request.json()
    const validated = allocateSchema.parse(body)
    const amount = Number(validated.amount)

    const goal = await prisma.goal.findUnique({
      where: { id: params.goalId },
    })

    if (!goal || goal.userId !== payload.userId) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const savings = await prisma.savings.findUnique({
      where: { userId: payload.userId },
    })

    if (!savings) {
      return NextResponse.json({ error: 'Savings account not found' }, { status: 404 })
    }

    if (Number(savings.amount) < amount) {
      return NextResponse.json(
        { error: 'Insufficient savings balance' },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.goal.update({
        where: { id: goal.id },
        data: { savedAmount: { increment: amount } },
      }),
      prisma.savings.update({
        where: { userId: payload.userId },
        data: { amount: { decrement: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId: payload.userId,
          type: 'GOAL_ALLOCATION',
          amount,
          description: `Allocated to goal: ${goal.name}`,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Goal allocation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
