import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  
  const revisions = await prisma.revision.findMany({
    where: { userId },
    include: { subject: true },
    orderBy: { nextDate: 'asc' }
  })

  return NextResponse.json(revisions)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, subjectId, lastDate } = await request.json()
  if (!title || !subjectId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const startDate = lastDate ? new Date(lastDate) : new Date()

  const revision = await prisma.revision.create({
    data: {
      title,
      subjectId,
      userId: session.user.id,
      lastDate: startDate,
      nextDate: addDays(startDate, 1), // First revision after 1 day
      intervalDays: 1,
      completedCount: 0
    }
  })

  return NextResponse.json(revision, { status: 201 })
}
