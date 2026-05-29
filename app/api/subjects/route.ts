import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = session.user.id

  const subjects = await prisma.subject.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(subjects)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, color, icon } = await request.json()
  if (!name) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }

  const subject = await prisma.subject.create({
    data: {
      name,
      color: color || '#84cc16',
      icon: icon || 'BookOpen',
      userId: session.user.id,
    },
  })

  return NextResponse.json(subject, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, name, color, icon } = await request.json()
  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
  }

  const subject = await prisma.subject.update({
    where: { id, userId: session.user.id },
    data: { name, color, icon },
  })

  return NextResponse.json(subject)
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

  await prisma.subject.delete({
    where: { id, userId: session.user.id },
  })

  return NextResponse.json({ message: 'Matéria excluída' })
}
