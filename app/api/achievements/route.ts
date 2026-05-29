import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: [{ unlockedAt: 'desc' }],
  })

  return NextResponse.json(userAchievements)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Calculate user stats
  const allSessions = await prisma.studySession.findMany({
    where: { userId },
  })

  const totalSeconds = allSessions.reduce((acc, s) => acc + s.duration, 0)
  const totalHours = totalSeconds / 3600
  const totalQuestions = allSessions.reduce((acc, s) => acc + s.questions, 0)

  // Streak
  const studiedDays = new Set(allSessions.map(s => {
    const d = new Date(s.date)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }))
  let streak = 0
  const checkDate = new Date()
  const todayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`
  if (!studiedDays.has(todayKey)) checkDate.setDate(checkDate.getDate() - 1)
  while (true) {
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`
    if (studiedDays.has(key)) { streak++; checkDate.setDate(checkDate.getDate() - 1) }
    else break
  }

  // Weekly goal check
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const weekSessions = allSessions.filter(s => new Date(s.date) >= weekStart)
  const weekHours = weekSessions.reduce((acc, s) => acc + s.duration, 0) / 3600

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { weeklyGoalHours: true } })
  const weeklyGoalMet = weekHours >= (user?.weeklyGoalHours || 20)

  const achievements = await prisma.achievement.findMany()
  const newlyUnlocked: string[] = []

  for (const achievement of achievements) {
    let progress = 0
    let unlocked = false

    switch (achievement.key) {
      case 'streak_7': progress = Math.min(streak, 7); unlocked = streak >= 7; break
      case 'streak_30': progress = Math.min(streak, 30); unlocked = streak >= 30; break
      case 'streak_100': progress = Math.min(streak, 100); unlocked = streak >= 100; break
      case 'hours_100': progress = Math.min(Math.floor(totalHours), 100); unlocked = totalHours >= 100; break
      case 'hours_500': progress = Math.min(Math.floor(totalHours), 500); unlocked = totalHours >= 500; break
      case 'hours_1000': progress = Math.min(Math.floor(totalHours), 1000); unlocked = totalHours >= 1000; break
      case 'questions_1000': progress = Math.min(totalQuestions, 1000); unlocked = totalQuestions >= 1000; break
      case 'questions_5000': progress = Math.min(totalQuestions, 5000); unlocked = totalQuestions >= 5000; break
      case 'weekly_goal': progress = weeklyGoalMet ? 1 : 0; unlocked = weeklyGoalMet; break
      case 'first_session': progress = allSessions.length > 0 ? 1 : 0; unlocked = allSessions.length > 0; break
      default: continue
    }

    const existing = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
    })

    if (existing) {
      if (!existing.unlockedAt && unlocked) {
        await prisma.userAchievement.update({
          where: { userId_achievementId: { userId, achievementId: achievement.id } },
          data: { progress, unlockedAt: new Date() },
        })
        newlyUnlocked.push(achievement.title)
      } else if (existing.progress !== progress) {
        await prisma.userAchievement.update({
          where: { userId_achievementId: { userId, achievementId: achievement.id } },
          data: { progress },
        })
      }
    } else {
      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id, progress, unlockedAt: unlocked ? new Date() : null },
      })
      if (unlocked) newlyUnlocked.push(achievement.title)
    }
  }

  return NextResponse.json({ newlyUnlocked })
}
