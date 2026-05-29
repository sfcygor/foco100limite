'use client'

import { useEffect, useState } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'
import { BarChart2, Clock, FileQuestion, BookOpen } from 'lucide-react'
import { secondsToHours } from '@/lib/utils'

type Period = 'today' | 'week' | 'month' | 'year' | 'all'
type Tab = 'horas' | 'questoes' | 'assuntos'

const COLORS = ['#84cc16','#f59e0b','#3b82f6','#8b5cf6','#06b6d4','#f97316','#ec4899','#10b981']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(132,204,22,0.2)',
        borderRadius: '10px', padding: '10px 14px', backdropFilter: 'blur(12px)' }}>
        <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || '#84cc16', fontSize: '14px', fontWeight: 700 }}>
            {p.name}: {p.value}{p.unit || ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DesempenhoPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [period, setPeriod] = useState<Period>('week')
  const [tab, setTab] = useState<Tab>('horas')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/sessions?period=${period}`).then(r => r.json())
      .then(data => { setSessions(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  // Process data for charts
  const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0)
  const totalQuestions = sessions.reduce((acc, s) => acc + s.questions, 0)
  const totalCorrect = sessions.reduce((acc, s) => acc + s.correct, 0)
  const acerto = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  // Group by day
  const byDay: Record<string, number> = {}
  sessions.forEach(s => {
    const d = new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    byDay[d] = (byDay[d] || 0) + s.duration
  })
  const dailyData = Object.entries(byDay).slice(-30).map(([day, dur]) => ({
    day, hours: Math.round((dur / 3600) * 10) / 10,
  }))

  // Group by subject
  const bySubject: Record<string, { name: string; color: string; duration: number; questions: number; correct: number }> = {}
  sessions.forEach(s => {
    if (!s.subject) return
    if (!bySubject[s.subjectId]) {
      bySubject[s.subjectId] = { name: s.subject.name, color: s.subject.color, duration: 0, questions: 0, correct: 0 }
    }
    bySubject[s.subjectId].duration += s.duration
    bySubject[s.subjectId].questions += s.questions
    bySubject[s.subjectId].correct += s.correct
  })
  const subjectData = Object.values(bySubject).sort((a, b) => b.duration - a.duration)
  const pieData = subjectData.slice(0, 6).map(s => ({
    name: s.name, value: Math.round(s.duration / 60), color: s.color,
  }))

  // Questions by day
  const questionsByDay: Record<string, { respondidas: number; corretas: number }> = {}
  sessions.forEach(s => {
    const d = new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    if (!questionsByDay[d]) questionsByDay[d] = { respondidas: 0, corretas: 0 }
    questionsByDay[d].respondidas += s.questions
    questionsByDay[d].corretas += s.correct
  })
  const questionsData = Object.entries(questionsByDay).slice(-30).map(([day, q]) => ({ day, ...q }))

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mês' },
    { key: 'year', label: 'Ano' },
    { key: 'all', label: 'Tudo' },
  ]

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'horas', label: 'Horas Estudadas', icon: Clock },
    { key: 'questoes', label: 'Questões', icon: FileQuestion },
    { key: 'assuntos', label: 'Por Assuntos', icon: BookOpen },
  ]

  const hasData = sessions.length > 0

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f9fafb', marginBottom: '6px' }}>Desempenho</h1>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Análise detalhada do seu progresso de estudos</p>
      </div>

      {/* Period Filter */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', padding: '4px',
        background: 'rgba(255,255,255,0.04)', borderRadius: '12px', width: 'fit-content' }}>
        {PERIODS.map(({ key, label }) => (
          <button key={key} onClick={() => setPeriod(key)}
            style={{
              padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer',
              background: period === key ? 'rgba(132,204,22,0.2)' : 'none',
              color: period === key ? '#84cc16' : '#9ca3af',
              fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Top metrics */}
      <div className="grid-cols-responsive" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Horas estudadas', value: `${secondsToHours(totalDuration)}h`, color: '#84cc16' },
          { label: 'Questões respondidas', value: totalQuestions.toString(), color: '#f59e0b' },
          { label: 'Taxa de acerto', value: `${acerto}%`, color: '#06b6d4' },
          { label: 'Sessões', value: sessions.length.toString(), color: '#8b5cf6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color, marginBottom: '4px' }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0' }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              color: tab === key ? '#84cc16' : '#9ca3af',
              fontSize: '13px', fontWeight: 600,
              borderBottom: `2px solid ${tab === key ? '#84cc16' : 'transparent'}`,
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s', marginBottom: '-1px',
            }}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {!hasData && !loading ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <BarChart2 size={48} color="#374151" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', color: '#6b7280', fontWeight: 600, marginBottom: '8px' }}>
            Ainda não há dados neste período.
          </h3>
          <p style={{ fontSize: '14px', color: '#4b5563' }}>Registre sessões de estudo para ver suas métricas aqui.</p>
        </div>
      ) : loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: '280px', borderRadius: '16px' }} />)}
        </div>
      ) : (
        <>
          {tab === 'horas' && (
            <div className="grid-cols-responsive-main" style={{ marginBottom: '24px' }}>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f9fafb', marginBottom: '16px' }}>Horas por Dia</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="hours" stroke="#84cc16" fill="url(#hoursGrad)" strokeWidth={2} name="Horas" unit="h" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f9fafb', marginBottom: '16px' }}>Distribuição por Matéria</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                      dataKey="value" nameKey="name" paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${Math.round(v / 60 * 10) / 10}h`]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {tab === 'questoes' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f9fafb', marginBottom: '16px' }}>Questões por Dia</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={questionsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="respondidas" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Respondidas" barSize={16} />
                  <Bar dataKey="corretas" fill="#84cc16" radius={[4, 4, 0, 0]} name="Corretas" barSize={16} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {tab === 'assuntos' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f9fafb', marginBottom: '16px' }}>Desempenho por Matéria</h3>
              <table className="table-glass">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Matéria</th>
                    <th style={{ textAlign: 'right' }}>Horas</th>
                    <th style={{ textAlign: 'right' }}>Questões</th>
                    <th style={{ textAlign: 'right' }}>Acerto</th>
                    <th style={{ textAlign: 'left' }}>Progresso</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectData.map((s, i) => {
                    const maxDur = subjectData[0]?.duration || 1
                    const pct = Math.round((s.duration / maxDur) * 100)
                    const acerto = s.questions > 0 ? Math.round((s.correct / s.questions) * 100) : 0
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                            {s.name}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', color: '#84cc16', fontWeight: 700 }}>
                          {secondsToHours(s.duration)}h
                        </td>
                        <td style={{ textAlign: 'right' }}>{s.questions}</td>
                        <td style={{ textAlign: 'right', color: acerto >= 70 ? '#84cc16' : '#f59e0b', fontWeight: 600 }}>
                          {acerto > 0 ? `${acerto}%` : '-'}
                        </td>
                        <td style={{ width: '120px' }}>
                          <div className="progress-bar" style={{ height: '4px' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: '2px' }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
