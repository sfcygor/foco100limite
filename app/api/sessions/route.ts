import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = session.user.id
  const period = searchParams.get('period') || 'all'
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

  let dateFilter: Date | undefined
  if (period === 'today') dateFilter = startOfDay()
  else if (period === 'week') dateFilter = startOfWeek()
  else if (period === 'month') dateFilter = startOfMonth()
  else if (period === 'year') dateFilter = startOfYear()

  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      ...(dateFilter && { date: { gte: dateFilter } }),
    },
    include: { subject: true },
    orderBy: { date: 'desc' },
    ...(limit && { take: limit }),
  })

  return NextResponse.json(sessions)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { subjectId, duration, questions, correct, date, note } = await request.json()

  if (!subjectId || !duration) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const studySession = await prisma.studySession.create({
    data: {
      userId: session.user.id,
      subjectId,
      duration: parseInt(duration),
      questions: parseInt(questions || 0),
      correct: parseInt(correct || 0),
      date: date ? new Date(date) : new Date(),
      note: note || null,
    },
    include: { subject: true },
  })

  return NextResponse.json(studySession, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
  }

  await prisma.studySession.delete({
    where: { id, userId: session.user.id },
  })

  return NextResponse.json({ message: 'Sessão excluída' })
}
