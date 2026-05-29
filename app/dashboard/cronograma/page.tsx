'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Check, Edit3, GripVertical, Calendar } from 'lucide-react'

interface ScheduleItem {
  id: string
  dayOfWeek: number
  title: string
  done: boolean
  order: number
  subject?: { id: string; name: string; color: string } | null
}

const DAYS = [
  { index: 1, label: 'SEG', full: 'Segunda' },
  { index: 2, label: 'TER', full: 'Terça' },
  { index: 3, label: 'QUA', full: 'Quarta' },
  { index: 4, label: 'QUI', full: 'Quinta' },
  { index: 5, label: 'SEX', full: 'Sexta' },
  { index: 6, label: 'SÁB', full: 'Sábado' },
  { index: 0, label: 'DOM', full: 'Domingo' },
]

export default function CronogramaPage() {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [newTitle, setNewTitle] = useState<Record<number, string>>({})
  const [adding, setAdding] = useState<number | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/schedule').then(r => r.json()).then(setItems)
  }, [])

  const today = new Date().getDay()

  async function handleAdd(day: number) {
    const title = newTitle[day]?.trim()
    if (!title) return
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayOfWeek: day, title, order: items.filter(i => i.dayOfWeek === day).length }),
    })
    if (res.ok) {
      const item = await res.json()
      setItems(prev => [...prev, item])
      setNewTitle(prev => ({ ...prev, [day]: '' }))
      setAdding(null)
    }
  }

  async function handleToggle(item: ScheduleItem) {
    const res = await fetch('/api/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, done: !item.done }),
    })
    if (res.ok) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i))
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Tarefa removida')
  }

  async function handleEdit(item: ScheduleItem) {
    if (editing === item.id) {
      const res = await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, title: editTitle }),
      })
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, title: editTitle } : i))
        setEditing(null)
      }
    } else {
      setEditing(item.id)
      setEditTitle(item.title)
    }
  }

  async function handleDrop(e: React.DragEvent, targetDay: number) {
    e.preventDefault()
    const id = dragging
    if (!id) return
    const item = items.find(i => i.id === id)
    if (!item || item.dayOfWeek === targetDay) { setDragOver(null); setDragging(null); return }
    
    await fetch('/api/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, dayOfWeek: targetDay }),
    })
    setItems(prev => prev.map(i => i.id === id ? { ...i, dayOfWeek: targetDay } : i))
    setDragOver(null)
    setDragging(null)
    toast.success('Tarefa movida!')
  }

  const completedAll = items.length > 0 ? items.filter(i => i.done).length : 0
  const totalAll = items.length

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>Cronograma Semanal</h1>
          <div className="badge badge-neon">{completedAll}/{totalAll} concluídas</div>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontStyle: 'italic' }}>
          "Disciplina é a ponte entre metas e conquistas."
        </p>
      </div>

      {/* Week grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
        {DAYS.map(({ index, label, full }) => {
          const dayItems = items.filter(i => i.dayOfWeek === index)
          const isToday = index === today
          const done = dayItems.filter(i => i.done).length

          return (
            <div
              key={index}
              style={{
                background: dragOver === index ? 'rgba(0,194,255,0.08)' : 'var(--color-bg-card)',
                border: `1px solid ${isToday ? 'rgba(0,194,255,0.3)' : dragOver === index ? 'rgba(0,194,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '14px',
                padding: '14px 10px',
                minHeight: '300px',
                transition: 'all 0.2s',
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(index) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, index)}
            >
              {/* Day header */}
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 800, letterSpacing: '1px',
                  color: isToday ? '#00C2FF' : 'var(--color-text-muted)',
                }}>
                  {label}
                </div>
                {isToday && (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C2FF',
                    margin: '4px auto 0', boxShadow: '0 0 6px rgba(0,194,255,0.5)' }} />
                )}
                {dayItems.length > 0 && (
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {done}/{dayItems.length}
                  </div>
                )}
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                {dayItems.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragging(item.id)}
                    onDragEnd={() => setDragging(null)}
                    style={{
                      padding: '8px 10px',
                      background: item.done ? 'rgba(0,194,255,0.06)' : 'var(--color-bg-card)',
                      borderRadius: '8px',
                      border: `1px solid ${item.done ? 'rgba(0,194,255,0.15)' : 'var(--color-border)'}`,
                      cursor: 'grab',
                      opacity: dragging === item.id ? 0.5 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {editing === item.id ? (
                      <input
                        className="input-glass"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEdit(item)}
                        autoFocus
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      />
                    ) : (
                      <p style={{
                        fontSize: '12px', color: item.done ? 'var(--color-text-muted)' : 'var(--color-text-muted)',
                        textDecoration: item.done ? 'line-through' : 'none',
                        lineHeight: 1.3,
                      }}>
                        {item.title}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleToggle(item)}
                        style={{ padding: '3px', border: 'none', background: 'none',
                          color: item.done ? '#00C2FF' : 'var(--color-text-muted)', cursor: 'pointer' }}>
                        <Check size={12} />
                      </button>
                      <button onClick={() => handleEdit(item)}
                        style={{ padding: '3px', border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                        <Edit3 size={12} />
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        style={{ padding: '3px', border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add task */}
              {adding === index ? (
                <div>
                  <input
                    className="input-glass"
                    placeholder="Nova tarefa..."
                    value={newTitle[index] || ''}
                    onChange={e => setNewTitle(prev => ({ ...prev, [index]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(index); if (e.key === 'Escape') setAdding(null) }}
                    autoFocus
                    style={{ fontSize: '12px', padding: '6px 8px', marginBottom: '4px' }}
                  />
                  <button onClick={() => handleAdd(index)}
                    style={{ width: '100%', padding: '5px', background: 'rgba(0,194,255,0.1)',
                      border: '1px solid rgba(0,194,255,0.2)', borderRadius: '6px',
                      color: '#00C2FF', fontSize: '12px', cursor: 'pointer' }}>
                    Adicionar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(index)}
                  style={{ width: '100%', padding: '6px', background: 'none',
                    border: '1px dashed var(--color-border)', borderRadius: '8px',
                    color: '#4b5563', fontSize: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,194,255,0.2)'; e.currentTarget.style.color = '#00C2FF' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = '#4b5563' }}
                >
                  <Plus size={12} /> Adicionar
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
