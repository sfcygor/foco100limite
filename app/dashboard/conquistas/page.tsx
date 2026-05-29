'use client'

import { useEffect, useState } from 'react'
import { Medal, Lock } from 'lucide-react'

interface UserAchievement {
  id: string
  progress: number
  unlockedAt: string | null
  achievement: {
    id: string
    key: string
    title: string
    description: string
    icon: string
    category: string
    threshold: number
  }
}

export default function ConquistasPage() {
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sync achievements first
    fetch('/api/achievements', { method: 'POST' })
      .then(() => fetch('/api/achievements'))
      .then(r => r.json())
      .then(data => { setAchievements(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const unlocked = achievements.filter(a => a.unlockedAt)
  const locked = achievements.filter(a => !a.unlockedAt)

  const categories: Record<string, string> = {
    milestone: '🚀 Marcos',
    streak: '🔥 Sequências',
    hours: '⏰ Horas',
    questions: '📝 Questões',
    goal: '✅ Metas',
    general: '⭐ Geral',
  }

  function getProgressPercent(a: UserAchievement) {
    if (a.unlockedAt) return 100
    if (a.achievement.threshold === 0) return 0
    return Math.min(Math.round((a.progress / a.achievement.threshold) * 100), 99)
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Medal size={22} color="#f59e0b" />
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f9fafb' }}>Conquistas</h1>
        </div>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          {unlocked.length} de {achievements.length} conquistas desbloqueadas
        </p>
      </div>

      {/* Progress overview */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#f9fafb' }}>Progresso Geral</span>
          <span style={{ fontSize: '13px', color: '#84cc16', fontWeight: 700 }}>
            {achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0}%
          </span>
        </div>
        <div className="progress-bar" style={{ height: '8px' }}>
          <div className="progress-fill" style={{
            width: `${achievements.length > 0 ? (unlocked.length / achievements.length) * 100 : 0}%`
          }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '16px' }} />)}
        </div>
      ) : achievements.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <Medal size={48} color="#374151" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280' }}>Nenhuma conquista disponível. Comece a estudar!</p>
        </div>
      ) : (
        <>
          {/* Unlocked */}
          {unlocked.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#84cc16', marginBottom: '14px' }}>
                ✨ Desbloqueadas ({unlocked.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                {unlocked.map(a => (
                  <div
                    key={a.id}
                    className="achievement-unlocked"
                    style={{
                      padding: '22px 18px',
                      background: 'linear-gradient(135deg, rgba(132,204,22,0.1), rgba(101,163,13,0.05))',
                      border: '1px solid rgba(132,204,22,0.25)',
                      borderRadius: '16px',
                      textAlign: 'center',
                      transition: 'all 0.3s',
                    }}
                  >
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>{a.achievement.icon}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#84cc16', marginBottom: '4px' }}>
                      {a.achievement.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.4, marginBottom: '10px' }}>
                      {a.achievement.description}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                      {a.unlockedAt ? new Date(a.unlockedAt).toLocaleDateString('pt-BR') : ''}
                    </div>
                    <div style={{ marginTop: '8px', padding: '3px 10px',
                      background: 'rgba(132,204,22,0.15)', borderRadius: '999px', display: 'inline-block' }}>
                      <span style={{ fontSize: '11px', color: '#84cc16', fontWeight: 700 }}>✓ Desbloqueada</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked */}
          {locked.length > 0 && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#6b7280', marginBottom: '14px' }}>
                🔒 Bloqueadas ({locked.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                {locked.map(a => {
                  const pct = getProgressPercent(a)
                  return (
                    <div
                      key={a.id}
                      style={{
                        padding: '22px 18px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '16px',
                        textAlign: 'center',
                        opacity: 0.7,
                      }}
                    >
                      <div style={{ fontSize: '40px', marginBottom: '10px', filter: 'grayscale(100%)' }}>
                        {a.achievement.icon}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#6b7280', marginBottom: '4px' }}>
                        {a.achievement.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.4, marginBottom: '12px' }}>
                        {a.achievement.description}
                      </div>
                      {a.achievement.threshold > 1 && (
                        <>
                          <div className="progress-bar" style={{ height: '4px', marginBottom: '4px' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: '#374151', borderRadius: '2px', transition: 'width 0.5s' }} />
                          </div>
                          <div style={{ fontSize: '11px', color: '#4b5563' }}>
                            {a.progress} / {a.achievement.threshold} ({pct}%)
                          </div>
                        </>
                      )}
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
