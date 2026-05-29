import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date()
  const todayStart = startOfDay()
  const weekStart = startOfWeek()
  const yearStart = startOfYear()

  // Total sessions all time
  const allSessions = await prisma.studySession.findMany({
    where: { userId },
    include: { subject: true },
    orderBy: { date: 'desc' },
  })

  // Week sessions
  const weekSessions = allSessions.filter(s => new Date(s.date) >= weekStart)
  // Today sessions
  const todaySessions = allSessions.filter(s => new Date(s.date) >= todayStart)
  // Year sessions
  const yearSessions = allSessions.filter(s => new Date(s.date) >= yearStart)

  // Metrics
  const weekDuration = weekSessions.reduce((acc, s) => acc + s.duration, 0)
  const weekQuestions = weekSessions.reduce((acc, s) => acc + s.questions, 0)
  const weekCorrect = weekSessions.reduce((acc, s) => acc + s.correct, 0)
  const totalDuration = allSessions.reduce((acc, s) => acc + s.duration, 0)
  const totalQuestions = allSessions.reduce((acc, s) => acc + s.questions, 0)
  const totalCorrect = allSessions.reduce((acc, s) => acc + s.correct, 0)
  const todayDuration = todaySessions.reduce((acc, s) => acc + s.duration, 0)
  const yearDuration = yearSessions.reduce((acc, s) => acc + s.duration, 0)

  // Unique subjects this week
  const weekSubjects = new Set(weekSessions.map(s => s.subjectId)).size

  // Days studied this year (unique days)
  const yearDays = new Set(yearSessions.map(s => {
    const d = new Date(s.date)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  })).size

  // Streak calculation
  let streak = 0
  const studiedDays = new Set(allSessions.map(s => {
    const d = new Date(s.date)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }))
  
  const checkDate = new Date()
  // If not studied today, start from yesterday
  const todayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`
  if (!studiedDays.has(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1)
  }
  
  while (true) {
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`
    if (studiedDays.has(key)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  // Hours by day of week (last 7 days)
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const nextD = new Date(d)
    nextD.setDate(nextD.getDate() + 1)
    
    const daySessions = allSessions.filter(s => {
      const sd = new Date(s.date)
      return sd >= d && sd < nextD
    })
    
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    last7Days.push({
      day: dayNames[d.getDay()],
      date: d.toISOString().split('T')[0],
      hours: Math.round((daySessions.reduce((acc, s) => acc + s.duration, 0) / 3600) * 10) / 10,
      isToday: i === 0,
    })
  }

  // Subject stats
  const subjectMap: Record<string, { name: string; color: string; duration: number; questions: number; correct: number; lastStudied: Date | null }> = {}
  for (const s of allSessions) {
    if (!subjectMap[s.subjectId]) {
      subjectMap[s.subjectId] = {
        name: s.subject.name,
        color: s.subject.color,
        duration: 0,
        questions: 0,
        correct: 0,
        lastStudied: null,
      }
    }
    subjectMap[s.subjectId].duration += s.duration
    subjectMap[s.subjectId].questions += s.questions
    subjectMap[s.subjectId].correct += s.correct
    if (!subjectMap[s.subjectId].lastStudied || new Date(s.date) > subjectMap[s.subjectId].lastStudied!) {
      subjectMap[s.subjectId].lastStudied = new Date(s.date)
    }
  }

  const subjectStats = Object.values(subjectMap).sort((a, b) => b.duration - a.duration)

  // User goals
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { dailyGoalHours: true, weeklyGoalHours: true, monthlyGoalHours: true } })
  const weeklyGoalSeconds = (user?.weeklyGoalHours || 20) * 3600
  const dailyGoalSeconds = (user?.dailyGoalHours || 3) * 3600
  const monthlyGoalSeconds = (user?.monthlyGoalHours || 60) * 3600

  return NextResponse.json({
    week: {
      duration: weekDuration,
      questions: weekQuestions,
      correct: weekCorrect,
      subjects: weekSubjects,
      progressPercent: Math.min(Math.round((weekDuration / weeklyGoalSeconds) * 100), 100),
    },
    today: {
      duration: todayDuration,
      sessions: todaySessions.length,
    },
    year: {
      duration: yearDuration,
      daysStudied: yearDays,
      streak,
    },
    total: {
      duration: totalDuration,
      questions: totalQuestions,
      correct: totalCorrect,
      sessions: allSessions.length,
    },
    charts: {
      last7Days,
      yearHeatmap: yearSessions.map(s => ({ date: s.date.toISOString(), duration: s.duration })),
    },
    subjects: subjectStats,
    goals: {
      dailyHours: user?.dailyGoalHours || 3,
      weeklyHours: user?.weeklyGoalHours || 20,
      monthlyHours: user?.monthlyGoalHours || 60,
    }
  })
}
