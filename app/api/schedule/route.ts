import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.scheduleItem.findMany({
    where: { userId: session.user.id },
    include: { subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { order: 'asc' }],
  })

  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { dayOfWeek, title, subjectId, order } = await request.json()

  const item = await prisma.scheduleItem.create({
    data: {
      userId: session.user.id,
      dayOfWeek: parseInt(dayOfWeek),
      title,
      subjectId: subjectId || null,
      order: order || 0,
    },
    include: { subject: true },
  })

  return NextResponse.json(item, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, title, done, dayOfWeek, order, subjectId } = await request.json()

  const item = await prisma.scheduleItem.update({
    where: { id, userId: session.user.id },
    data: {
      ...(title !== undefined && { title }),
      ...(done !== undefined && { done }),
      ...(dayOfWeek !== undefined && { dayOfWeek }),
      ...(order !== undefined && { order }),
      ...(subjectId !== undefined && { subjectId: subjectId || null }),
    },
    include: { subject: true },
  })

  return NextResponse.json(item)
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  await prisma.scheduleItem.delete({
    where: { id: id!, userId: session.user.id },
  })

  return NextResponse.json({ message: 'Item excluído' })
}
