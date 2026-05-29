'use client'

import { useMemo } from 'react'
import { subDays, format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { secondsToHours } from '@/lib/utils'

interface StudyHeatmapProps {
  sessions: { date: string; duration: number }[]
}

export function StudyHeatmap({ sessions }: StudyHeatmapProps) {
  // Generate last 365 days
  const days = useMemo(() => {
    const today = new Date()
    const startDate = startOfWeek(subDays(today, 364), { weekStartsOn: 0 }) // Start on a Sunday
    
    const allDays = []
    let current = startDate
    for (let i = 0; i < 371; i++) { // 53 weeks * 7 days = 371
      if (current > today) break
      allDays.push(current)
      current = addDays(current, 1)
    }
    return allDays
  }, [])

  // Map sessions to days
  const activityMap = useMemo(() => {
    const map = new Map<string, number>()
    sessions.forEach(s => {
      const dateStr = s.date.split('T')[0]
      map.set(dateStr, (map.get(dateStr) || 0) + s.duration)
    })
    return map
  }, [sessions])

  // Helper to determine color intensity based on hours studied
  const getColor = (durationSeconds: number) => {
    if (durationSeconds === 0) return 'var(--color-bg-card)'
    const hours = durationSeconds / 3600
    if (hours < 1) return 'rgba(0, 194, 255, 0.25)'   // light neon
    if (hours < 3) return 'rgba(0, 194, 255, 0.5)'    // medium
    if (hours < 5) return 'rgba(0, 194, 255, 0.8)'    // strong
    return 'rgba(0, 194, 255, 1)'                     // full neon
  }

  // Group by weeks for the grid columns
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Heatmap de Estudo Anual</h3>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          <span>Menos</span>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: getColor(0) }} />
          <div style={{ width: 10, height: 10, borderRadius: 2, background: getColor(1800) }} />
          <div style={{ width: 10, height: 10, borderRadius: 2, background: getColor(7200) }} />
          <div style={{ width: 10, height: 10, borderRadius: 2, background: getColor(14400) }} />
          <div style={{ width: 10, height: 10, borderRadius: 2, background: getColor(21600) }} />
          <span>Mais</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', minWidth: '800px' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '8px', paddingTop: '16px' }}>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', height: '12px' }}></span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', height: '12px', lineHeight: '12px' }}>Seg</span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', height: '12px' }}></span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', height: '12px', lineHeight: '12px' }}>Qua</span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', height: '12px' }}></span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', height: '12px', lineHeight: '12px' }}>Sex</span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', height: '12px' }}></span>
        </div>

        {/* Heatmap Grid */}
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          {weeks.map((week, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Optional Month Label for first week of month */}
              <div style={{ height: '12px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                {week[0].getDate() <= 7 ? format(week[0], 'MMM', { locale: ptBR }) : ''}
              </div>
              
              {week.map((day, j) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const duration = activityMap.get(dateStr) || 0
                return (
                  <motion.div
                    key={j}
                    whileHover={{ scale: 1.2, zIndex: 10 }}
                    title={`${format(day, "dd 'de' MMM, yyyy", { locale: ptBR })}: ${secondsToHours(duration)}h`}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: getColor(duration),
                      cursor: 'pointer',
                      border: '1px solid rgba(45, 15, 80, 0.1)'
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
