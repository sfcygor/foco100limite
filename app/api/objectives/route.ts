import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  
  const objectives = await prisma.objective.findMany({
    where: { userId },
    include: { subject: true },
    orderBy: { deadline: 'asc' }
  })

  return NextResponse.json(objectives)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, subjectId, deadline } = await request.json()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const objective = await prisma.objective.create({
    data: {
      title,
      description,
      subjectId,
      deadline: deadline ? new Date(deadline) : null,
      userId: session.user.id,
      status: 'TODO'
    }
  })

  return NextResponse.json(objective, { status: 201 })
}
