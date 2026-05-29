'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Star, Crown, Flame } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface RankingUser {
  id: string
  name: string
  isCurrentUser: boolean
  totalHours: number
  weekHours: number
  totalQuestions: number
  weekQuestions: number
  streak: number
}

interface RankingData {
  global: RankingUser[]
  week: RankingUser[]
}

function RankBadge({ position }: { position: number }) {
  if (position === 1) return <Crown size={18} color="#f59e0b" fill="#f59e0b" />
  if (position === 2) return <Medal size={18} color="#9ca3af" fill="#9ca3af" />
  if (position === 3) return <Star size={18} color="#f97316" fill="#f97316" />
  return <span style={{ fontSize: '13px', fontWeight: 700, color: '#6b7280' }}>#{position}</span>
}

export default function RankingPage() {
  const [data, setData] = useState<RankingData | null>(null)
  const [tab, setTab] = useState<'global' | 'week'>('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ranking').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const list = tab === 'week' ? data?.week : data?.global

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Trophy size={22} color="#f59e0b" />
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f9fafb' }}>Ranking</h1>
        </div>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Compare seu desempenho com outros estudantes</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', padding: '4px',
        background: 'rgba(255,255,255,0.04)', borderRadius: '12px', width: 'fit-content' }}>
        {[
          { key: 'week', label: '🗓 Ranking Semanal' },
          { key: 'global', label: '🌐 Ranking Global' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as any)}
            style={{
              padding: '8px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer',
              background: tab === key ? 'rgba(132,204,22,0.2)' : 'none',
              color: tab === key ? '#84cc16' : '#9ca3af',
              fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
            }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '14px' }} />)}
        </div>
      ) : !list?.length ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <Trophy size={48} color="#374151" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Nenhum dado disponível ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {list.map((user, index) => {
            const pos = index + 1
            const isTop3 = pos <= 3
            const hours = tab === 'week' ? user.weekHours : user.totalHours
            const questions = tab === 'week' ? user.weekQuestions : user.totalQuestions

            return (
              <div
                key={user.id}
                style={{
                  padding: '18px 22px',
                  background: user.isCurrentUser
                    ? 'rgba(132,204,22,0.08)'
                    : isTop3 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                  border: user.isCurrentUser
                    ? '1px solid rgba(132,204,22,0.25)'
                    : `1px solid ${isTop3 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                {pos === 1 && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }} />
                )}

                {/* Position */}
                <div style={{ width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <RankBadge position={pos} />
                </div>

                {/* Avatar */}
                <div className="avatar" style={{
                  width: '40px', height: '40px', fontSize: '14px',
                  background: user.isCurrentUser
                    ? 'linear-gradient(135deg, #84cc16, #65a30d)'
                    : isTop3
                    ? `linear-gradient(135deg, ${pos === 1 ? '#f59e0b' : pos === 2 ? '#9ca3af' : '#f97316'}, transparent)`
                    : 'rgba(255,255,255,0.1)',
                  color: user.isCurrentUser || isTop3 ? '#0b0f17' : '#9ca3af',
                }}>
                  {getInitials(user.name)}
                </div>

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: user.isCurrentUser ? '#84cc16' : '#f9fafb' }}>
                      {user.name}
                    </span>
                    {user.isCurrentUser && (
                      <span className="badge badge-neon" style={{ fontSize: '10px', padding: '2px 6px' }}>Você</span>
                    )}
                  </div>
                  {user.streak > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Flame size={12} color="#f59e0b" />
                      <span style={{ fontSize: '11px', color: '#f59e0b' }}>{user.streak} dias seguidos</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#84cc16' }}>{hours}h</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>horas</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>{questions}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>questões</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
