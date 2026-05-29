import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status, title, description, deadline, subjectId } = await request.json()
  
  // Verify ownership
  const obj = await prisma.objective.findUnique({ where: { id } })
  if (!obj || obj.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.objective.update({
    where: { id },
    data: {
      status: status !== undefined ? status : obj.status,
      title: title !== undefined ? title : obj.title,
      description: description !== undefined ? description : obj.description,
      deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : obj.deadline,
      subjectId: subjectId !== undefined ? subjectId : obj.subjectId
    }
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  
  await prisma.objective.deleteMany({
    where: { id, userId: session.user.id }
  })

  return NextResponse.json({ success: true })
}
