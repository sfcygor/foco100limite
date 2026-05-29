import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, weeklyGoalHours: true, createdAt: true },
  })

  return NextResponse.json(user)
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, weeklyGoalHours, currentPassword, newPassword } = await request.json()

  const updateData: Record<string, unknown> = {}
  if (name) updateData.name = name
  if (weeklyGoalHours) updateData.weeklyGoalHours = parseInt(weeklyGoalHours)

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Senha atual necessária' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.password) {
      return NextResponse.json({ error: 'Usuário sem senha' }, { status: 400 })
    }

    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    }

    updateData.password = await bcrypt.hash(newPassword, 12)
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, image: true, weeklyGoalHours: true },
  })

  return NextResponse.json(updated)
}
