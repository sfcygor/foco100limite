'use client'

import { useEffect, useState } from 'react'
import { FileText, TrendingUp, TrendingDown, Minus, Calendar, Clock, Flame } from 'lucide-react'
import { secondsToHours } from '@/lib/utils'

type ReportType = 'week' | 'month' | 'year'

function getMotivation(hours: number, avgDaily: number, consistency: number): string {
  if (hours === 0) return 'Comece agora! O primeiro passo é sempre o mais difícil.'
  if (consistency >= 90) return '🏆 Consistência impecável! Você está no caminho da aprovação.'
  if (consistency >= 70) return '💪 Ótima constância! Mantenha esse ritmo.'
  if (avgDaily >= 4) return '📚 Excelente carga de estudo diária! Continue assim.'
  if (hours >= 50) return '⚡ Muito bom! Você já acumulou horas sólidas de estudo.'
  return '🎯 Intensifique seus estudos. Constância é a chave!'
}

export default function RelatoriosPage() {
  const [reportType, setReportType] = useState<ReportType>('week')
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const period = reportType === 'week' ? 'week' : reportType === 'month' ? 'month' : 'year'
    fetch(`/api/sessions?period=${period}`).then(r => r.json())
      .then(data => { setSessions(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [reportType])

  // Calculations
  const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0)
  const totalHours = secondsToHours(totalDuration)
  const totalQuestions = sessions.reduce((acc, s) => acc + s.questions, 0)
  const totalCorrect = sessions.reduce((acc, s) => acc + s.correct, 0)
  const acerto = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  const days = reportType === 'week' ? 7 : reportType === 'month' ? 30 : 365
  const avgDaily = totalHours / days

  // Active days
  const activeDays = new Set(sessions.map(s => {
    const d = new Date(s.date)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  })).size
  const consistency = Math.round((activeDays / days) * 100)

  // Subject stats
  const bySubject: Record<string, { name: string; color: string; duration: number; sessions: number }> = {}
  sessions.forEach(s => {
    if (!s.subject) return
    if (!bySubject[s.subjectId]) bySubject[s.subjectId] = { name: s.subject.name, color: s.subject.color, duration: 0, sessions: 0 }
    bySubject[s.subjectId].duration += s.duration
    bySubject[s.subjectId].sessions += 1
  })
  const subjectList = Object.values(bySubject).sort((a, b) => b.duration - a.duration)
  const bestSubject = subjectList[0]
  const worstSubject = subjectList[subjectList.length - 1]

  const motivation = getMotivation(totalHours, avgDaily, consistency)

  // Streak
  const studiedDays = new Set(sessions.map(s => {
    const d = new Date(s.date)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }))
  let streak = 0
  const checkDate = new Date()
  while (true) {
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`
    if (studiedDays.has(key)) { streak++; checkDate.setDate(checkDate.getDate() - 1) }
    else break
  }

  const REPORT_TYPES = [
    { key: 'week' as ReportType, label: 'Semanal' },
    { key: 'month' as ReportType, label: 'Mensal' },
    { key: 'year' as ReportType, label: 'Anual' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '6px' }}>Relatórios</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Análise completa do seu desempenho nos estudos</p>
      </div>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', padding: '4px',
        background: 'var(--color-bg-card)', borderRadius: '12px', width: 'fit-content' }}>
        {REPORT_TYPES.map(({ key, label }) => (
          <button key={key} onClick={() => setReportType(key)}
            style={{
              padding: '8px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer',
              background: reportType === key ? 'rgba(0,194,255,0.2)' : 'none',
              color: reportType === key ? '#00C2FF' : 'var(--color-text-muted)',
              fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
            }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '16px' }} />)}
        </div>
      ) : (
        <>
          {/* Motivational banner */}
          <div style={{ marginBottom: '20px', padding: '20px 24px',
            background: 'linear-gradient(135deg, rgba(0,194,255,0.1), rgba(101,163,13,0.05))',
            border: '1px solid rgba(0,194,255,0.2)', borderRadius: '16px',
            display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>💡</span>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#00C2FF', marginBottom: '2px' }}>
                Análise Inteligente
              </p>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{motivation}</p>
            </div>
          </div>

          {/* Main metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Tempo total', value: `${totalHours}h`, icon: Clock, color: '#00C2FF',
                sub: `${totalDuration > 0 ? Math.floor(totalDuration / 60) : 0} minutos` },
              { label: 'Média diária', value: `${avgDaily.toFixed(1)}h`, icon: Calendar, color: '#f59e0b',
                sub: `${days} dias analisados` },
              { label: 'Dias ativos', value: `${activeDays}`, icon: Flame, color: '#06b6d4',
                sub: `${consistency}% de consistência` },
            ].map(({ label, value, icon: Icon, color, sub }) => (
              <div key={label} className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Icon size={16} color={color} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{label}</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color, marginBottom: '4px' }}>{value}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Secondary metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Questões respondidas', value: totalQuestions.toString(), color: '#8b5cf6' },
              { label: 'Taxa de acerto', value: `${acerto}%`, color: acerto >= 70 ? '#00C2FF' : '#f59e0b' },
              { label: 'Sequência atual', value: `${streak} dias`, color: '#f97316' },
              { label: 'Sessões registradas', value: sessions.length.toString(), color: '#06b6d4' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card" style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color, marginBottom: '4px' }}>{value}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Subject analysis */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {bestSubject && (
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <TrendingUp size={16} color="#00C2FF" />
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Melhor Matéria</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: bestSubject.color }} />
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{bestSubject.name}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#00C2FF', fontWeight: 700 }}>{secondsToHours(bestSubject.duration)}h</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{bestSubject.sessions} sessões</div>
              </div>
            )}

            {subjectList.length > 1 && (
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <TrendingDown size={16} color="#f59e0b" />
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Matéria para Reforço</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: worstSubject.color }} />
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{worstSubject.name}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 700 }}>{secondsToHours(worstSubject.duration)}h</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Dedique mais tempo aqui</div>
              </div>
            )}
          </div>

          {/* All subjects */}
          {subjectList.length > 0 && (
            <div className="glass-card" style={{ padding: '24px', marginTop: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Todas as Matérias</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {subjectList.map((s, i) => {
                  const maxDur = subjectList[0].duration
                  const pct = Math.round((s.duration / maxDur) * 100)
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{s.name}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: s.color }}>{secondsToHours(s.duration)}h</span>
                      </div>
                      <div className="progress-bar" style={{ height: '5px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
