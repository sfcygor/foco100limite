import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Get all users with their study data for this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      sessions: {
        select: { duration: true, questions: true, date: true },
      },
    },
  })

  const ranking = users.map((u) => {
    const weekSessions = u.sessions.filter(s => new Date(s.date) >= weekStart)
    const totalDuration = u.sessions.reduce((acc, s) => acc + s.duration, 0)
    const weekDuration = weekSessions.reduce((acc, s) => acc + s.duration, 0)
    const totalQuestions = u.sessions.reduce((acc, s) => acc + s.questions, 0)
    const weekQuestions = weekSessions.reduce((acc, s) => acc + s.questions, 0)

    // Streak
    const studiedDays = new Set(u.sessions.map(s => {
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

    return {
      id: u.id,
      name: u.name || 'Usuário',
      isCurrentUser: u.id === userId,
      totalHours: Math.round((totalDuration / 3600) * 10) / 10,
      weekHours: Math.round((weekDuration / 3600) * 10) / 10,
      totalQuestions,
      weekQuestions,
      streak,
    }
  })

  const globalRanking = [...ranking].sort((a, b) => b.totalHours - a.totalHours)
  const weekRanking = [...ranking].sort((a, b) => b.weekHours - a.weekHours)

  return NextResponse.json({ global: globalRanking, week: weekRanking })
}
