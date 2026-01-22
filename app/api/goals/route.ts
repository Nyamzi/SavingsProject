import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { z } from 'zod'

const createGoalSchema = z.object({
  name: z.string().min(2),
  targetAmount: z.coerce.number().positive(),
})

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

    const goals = await prisma.goal.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      goals.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: g.targetAmount,
        savedAmount: g.savedAmount,
        createdAt: g.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Goals fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const validated = createGoalSchema.parse(body)

    const goal = await prisma.goal.create({
      data: {
        userId: payload.userId,
        name: validated.name,
        targetAmount: validated.targetAmount,
        savedAmount: 0,
      },
    })

    return NextResponse.json({
      success: true,
      goal: {
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount,
        createdAt: goal.createdAt.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Goal create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
