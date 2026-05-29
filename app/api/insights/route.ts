import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, differenceInDays } from 'date-fns'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const insights = []

  // Get user profile goals
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get subjects
  const subjects = await prisma.subject.findMany({ where: { userId } })
  
  // Get sessions from last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30)
  const recentSessions = await prisma.studySession.findMany({
    where: { userId, date: { gte: thirtyDaysAgo } },
    orderBy: { date: 'desc' },
  })

  // 1. Analyze abandoned subjects
  const subjectLastStudied = new Map<string, Date>()
  recentSessions.forEach(s => {
    if (!subjectLastStudied.has(s.subjectId)) {
      subjectLastStudied.set(s.subjectId, s.date)
    }
  })

  subjects.forEach(sub => {
    const lastStudied = subjectLastStudied.get(sub.id)
    if (!lastStudied) {
      insights.push({ type: 'warning', message: `Você não estuda ${sub.name} há mais de 30 dias.` })
    } else {
      const days = differenceInDays(new Date(), lastStudied)
      if (days > 10) {
        insights.push({ type: 'warning', message: `Você está há ${days} dias sem estudar ${sub.name}.` })
      }
    }
  })

  // 2. Analyze performance drop (last 7 days vs previous 7 days)
  const last7Days = subDays(new Date(), 7)
  const previous7Days = subDays(new Date(), 14)
  
  let current7Questions = 0; let current7Correct = 0;
  let prev7Questions = 0; let prev7Correct = 0;

  recentSessions.forEach(s => {
    if (s.date >= last7Days) {
      current7Questions += s.questions; current7Correct += s.correct;
    } else if (s.date >= previous7Days) {
      prev7Questions += s.questions; prev7Correct += s.correct;
    }
  })

  const currentAcc = current7Questions > 0 ? current7Correct / current7Questions : 0
  const prevAcc = prev7Questions > 0 ? prev7Correct / prev7Questions : 0

  if (prevAcc > 0 && currentAcc < prevAcc - 0.1) { // 10% drop
    insights.push({ type: 'danger', message: `Atenção: seu aproveitamento em questões caiu ${Math.round((prevAcc - currentAcc)*100)}% esta semana.` })
  } else if (currentAcc > prevAcc + 0.1 && prevAcc > 0) {
    insights.push({ type: 'success', message: `Excelente! Seu rendimento subiu ${Math.round((currentAcc - prevAcc)*100)}% esta semana.` })
  }

  // 3. Goal checking (Weekly)
  const thisWeekSessions = recentSessions.filter(s => s.date >= last7Days)
  const thisWeekDuration = thisWeekSessions.reduce((acc, s) => acc + s.duration, 0)
  const weeklyGoalSeconds = user.weeklyGoalHours * 3600

  if (thisWeekDuration < weeklyGoalSeconds / 2 && new Date().getDay() > 3) {
    insights.push({ type: 'info', message: 'Foco! Você ainda está longe da sua meta semanal de horas.' })
  } else if (thisWeekDuration >= weeklyGoalSeconds) {
    insights.push({ type: 'success', message: 'Meta semanal atingida! Você está imparável.' })
  }

  // Se não houver insights críticos, gerar um motivacional
  if (insights.length === 0) {
    insights.push({ type: 'info', message: 'Tudo em dia! Continue mantendo a constância.' })
  }

  return NextResponse.json({ insights: insights.slice(0, 3) })
}
