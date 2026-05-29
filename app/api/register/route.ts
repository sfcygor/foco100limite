import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Create default subjects for new user
    const defaultSubjects = [
      { name: 'Português', color: '#3b82f6' },
      { name: 'Matemática', color: '#f59e0b' },
      { name: 'Direito Constitucional', color: '#8b5cf6' },
      { name: 'Direito Administrativo', color: '#06b6d4' },
      { name: 'Informática', color: '#10b981' },
      { name: 'Raciocínio Lógico', color: '#f97316' },
    ]

    await prisma.subject.createMany({
      data: defaultSubjects.map((s) => ({ ...s, userId: user.id })),
    })

    // Initialize achievements for new user
    const achievements = await prisma.achievement.findMany()
    if (achievements.length > 0) {
      await prisma.userAchievement.createMany({
        data: achievements.map((a) => ({
          userId: user.id,
          achievementId: a.id,
          progress: 0,
        })),
      })
    }

    return NextResponse.json(
      { message: 'Usuário criado com sucesso', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
