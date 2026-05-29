import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  
  // Verify ownership
  const rev = await prisma.revision.findUnique({ where: { id } })
  if (!rev || rev.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Spaced repetition progression: 1, 3, 7, 15, 30, 60...
  const intervals = [1, 3, 7, 15, 30, 60, 120]
  const currentLevel = rev.completedCount
  const nextInterval = intervals[Math.min(currentLevel + 1, intervals.length - 1)]

  const updated = await prisma.revision.update({
    where: { id },
    data: {
      lastDate: new Date(),
      nextDate: addDays(new Date(), nextInterval),
      intervalDays: nextInterval,
      completedCount: { increment: 1 }
    }
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  
  await prisma.revision.deleteMany({
    where: { id, userId: session.user.id }
  })

  return NextResponse.json({ success: true })
}
