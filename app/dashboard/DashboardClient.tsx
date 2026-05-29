'use client'

import { useEffect, useState } from 'react'
import { 
  Clock, FileQuestion, Target, BookOpen, TrendingUp, 
  Calendar, Flame, Lightbulb, CheckCircle2, AlertCircle, Sparkles, XCircle, AlertTriangle
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine 
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDuration, secondsToHours, getGreeting, getMotivationalMessage } from '@/lib/utils'
import { StudyHeatmap } from '@/components/dashboard/StudyHeatmap'

interface StatsData {
  week: { duration: number; questions: number; correct: number; subjects: number; progressPercent: number }
  today: { duration: number; sessions: number }
  year: { duration: number; daysStudied: number; streak: number }
  total: { duration: number; questions: number; correct: number; sessions: number }
  charts: { last7Days: { day: string; hours: number; isToday: boolean }[]; yearHeatmap: { date: string; duration: number }[] }
  subjects: { name: string; color: string; duration: number; questions: number; correct: number; lastStudied: Date | null }[]
  goals: { dailyHours: number; weeklyHours: number; monthlyHours: number }
}

interface Insight {
  type: 'success' | 'warning' | 'danger' | 'info'
  message: string
}

function MetricCard({ icon: Icon, label, value, sub, color = '#84cc16', progress }: any) {
  return (
    <motion.div whileHover={{ y: -4 }} className="metric-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{
          width: '40px', height: '40px', background: `${color}18`, borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}22`,
        }}>
          <Icon size={18} color={color} />
        </div>
        {progress !== undefined && (
          <span style={{ fontSize: '12px', color, fontWeight: 700 }}>{progress}%</span>
        )}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: '#f9fafb', letterSpacing: '-0.5px', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>{sub}</div>}
      {progress !== undefined && (
        <div className="progress-bar" style={{ marginTop: '12px' }}>
          <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: color }} />
        </div>
      )}
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(132,204,22,0.2)',
        borderRadius: '10px', padding: '10px 14px', backdropFilter: 'blur(12px)',
      }}>
        <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
        <p style={{ color: '#84cc16', fontSize: '15px', fontWeight: 700 }}>{payload[0].value}h</p>
      </div>
    )
  }
  return null
}

export default function DashboardClient({ userId, userName }: { userId: string; userName?: string | null }) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/insights').then(r => r.json())
    ]).then(([statsData, insightsData]) => {
      setStats(statsData)
      if (insightsData.insights) setInsights(insightsData.insights)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '8px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div className="skeleton" style={{ height: '32px', width: '280px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '16px', width: '200px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '140px' }} />)}
        </div>
      </div>
    )
  }

  const acerto = stats && stats.total.questions > 0 ? Math.round((stats.total.correct / stats.total.questions) * 100) : 0
  const weekHours = stats ? secondsToHours(stats.week.duration) : 0
  const todayHours = stats ? secondsToHours(stats.today.duration) : 0
  
  const dailyGoal = stats?.goals?.dailyHours || 3
  const weeklyGoal = stats?.goals?.weeklyHours || 20
  const monthlyGoal = stats?.goals?.monthlyHours || 60

  const dailyProgress = Math.min((todayHours / dailyGoal) * 100, 100)
  const weeklyProgress = Math.min((weekHours / weeklyGoal) * 100, 100)
  // Approximate monthly progress using year duration / months... or we can just use 0 for now since we don't have month specific duration
  const monthlyProgress = 0 // Feature for later

  const motivMessage = getMotivationalMessage(weeklyProgress)
  const chartData = stats?.charts.last7Days || []

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f9fafb', marginBottom: '6px' }}>
            {getGreeting()}, {userName?.split(' ')[0] || 'Concurseiro'} 👋
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="glass-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 0 20px rgba(245,158,11,0.1)' }}>
          <Flame size={24} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.6))' }} />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{stats?.year.streak || 0}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>dias seguidos</div>
          </div>
        </div>
      </div>

      {/* Intelligent Insights Row */}
      {insights.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
          {insights.map((insight, idx) => {
            const Icon = insight.type === 'success' ? CheckCircle2 : insight.type === 'warning' ? AlertTriangle : insight.type === 'danger' ? XCircle : Sparkles
            const colors = {
              success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: '#10b981' },
              warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
              danger: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' },
              info: { bg: 'rgba(132,204,22,0.1)', border: 'rgba(132,204,22,0.2)', text: '#84cc16' }
            }
            const c = colors[insight.type]
            
            return (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                key={idx} style={{ 
                  flex: '1 0 300px', padding: '12px 16px', background: c.bg, border: `1px solid ${c.border}`, 
                  borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' 
                }}
              >
                <div style={{ color: c.text, marginTop: '2px' }}><Icon size={18} /></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: c.text }}>Insight Inteligente</div>
                  <div style={{ fontSize: '12px', color: '#d1d5db', marginTop: '2px', lineHeight: 1.4 }}>{insight.message}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid-cols-responsive" style={{ marginBottom: '24px' }}>
        <MetricCard icon={Clock} label="Hoje" value={`${todayHours}h`} sub={`Meta: ${dailyGoal}h`} progress={Math.round(dailyProgress)} />
        <MetricCard icon={Target} label="Semana" value={`${weekHours}h`} sub={`Meta: ${weeklyGoal}h`} color="#06b6d4" progress={Math.round(weeklyProgress)} />
        <MetricCard icon={FileQuestion} label="Questões na semana" value={stats?.week.questions.toString() || '0'} sub="questões respondidas" color="#f59e0b" />
        <MetricCard icon={BookOpen} label="Acerto geral" value={`${acerto}%`} sub={`${stats?.total.correct || 0} corretas de ${stats?.total.questions || 0}`} color="#8b5cf6" />
      </div>

      {/* Chart and Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        {stats?.charts.yearHeatmap && <StudyHeatmap sessions={stats.charts.yearHeatmap} />}
      </div>

      <div className="grid-cols-responsive-main" style={{ marginBottom: '24px' }}>
        {/* Bar chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f9fafb' }}>Horas por Dia</h3>
            <span className="badge badge-neon">Últimos 7 dias</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(132,204,22,0.05)' }} />
              <ReferenceLine y={weeklyGoal / 7} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
              <Bar dataKey="hours" fill="#84cc16" radius={[6, 6, 0, 0]} style={{ filter: 'drop-shadow(0 0 8px rgba(132,204,22,0.3))' }} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '16px', height: '2px', background: '#f59e0b', display: 'inline-block' }} /> 
              Meta diária ideal ({(weeklyGoal / 7).toFixed(1)}h)
            </p>
          </div>
        </div>

        {/* Top Subjects */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <BookOpen size={16} color="#06b6d4" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f9fafb' }}>Top Matérias</h3>
          </div>
          {(!stats?.subjects || stats.subjects.length === 0) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <AlertCircle size={16} color="#6b7280" />
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Nenhum estudo registrado ainda.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {stats.subjects.slice(0, 5).map((s, i) => {
                const maxDuration = stats.subjects[0].duration
                const percent = maxDuration > 0 ? Math.round((s.duration / maxDuration) * 100) : 0
                return (
                  <div key={s.name}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#6b7280', width: '16px' }}>{i + 1}</span>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}80` }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af' }}>{secondsToHours(s.duration)}h</span>
                    </div>
                    <div className="progress-bar" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: s.color, borderRadius: '3px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
