import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Deleta as sessões de estudo
    await prisma.studySession.deleteMany({
      where: { userId: session.user.id },
    })

    // Deleta o progresso em conquistas (Achievements)
    await prisma.userAchievement.deleteMany({
      where: { userId: session.user.id },
    })

    // Deleta progresso em Revisões
    await prisma.revision.deleteMany({
      where: { userId: session.user.id },
    })

    // Deleta Objetivos
    await prisma.objective.deleteMany({
      where: { userId: session.user.id },
    })

    // Re-inicia os achievements default com 0 de progresso
    const achievements = await prisma.achievement.findMany()
    if (achievements.length > 0) {
      await prisma.userAchievement.createMany({
        data: achievements.map((a) => ({
          userId: session.user?.id || '',
          achievementId: a.id,
          progress: 0,
        })),
      })
    }

    return NextResponse.json({ success: true, message: 'Estatísticas zeradas com sucesso' })
  } catch (error) {
    console.error('Error resetting stats:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
