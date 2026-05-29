'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, CheckCircle2, Clock, Plus, Trash2, BookOpen, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { format, isToday, isPast, isFuture, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SUBJECT_ICONS, IconName } from '@/components/subjects/SubjectManagerModal'

interface Subject { id: string; name: string; color: string; icon: string }
interface Revision {
  id: string
  title: string
  subjectId: string
  lastDate: string
  nextDate: string
  intervalDays: number
  completedCount: number
  subject: Subject
}

export default function RevisoesPage() {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSubject, setNewSubject] = useState('')

  const fetchData = async () => {
    setLoading(true)
    const [revRes, subRes] = await Promise.all([
      fetch('/api/revisions'), fetch('/api/subjects')
    ])
    if (revRes.ok) setRevisions(await revRes.json())
    if (subRes.ok) setSubjects(await subRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newSubject) { toast.error('Preencha todos os campos'); return }

    const res = await fetch('/api/revisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, subjectId: newSubject })
    })

    if (res.ok) {
      toast.success('Revisão agendada com sucesso!')
      setShowModal(false); setNewTitle(''); setNewSubject('')
      fetchData()
    } else {
      const err = await res.json().catch(() => null)
      toast.error(err?.error || 'Erro ao agendar revisão.')
    }
  }

  const handleComplete = async (id: string) => {
    const res = await fetch(`/api/revisions/${id}`, { method: 'PUT' })
    if (res.ok) {
      toast.success('Revisão concluída! Próxima data agendada.')
      fetchData()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta revisão?')) return
    
    // Optimistic UI update
    const previousRevisions = [...revisions]
    setRevisions(prev => prev.filter(r => r.id !== id))
    
    const res = await fetch(`/api/revisions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Revisão excluída.')
    } else {
      toast.error('Erro ao excluir revisão.')
      setRevisions(previousRevisions)
    }
  }

  // Categorize revisions
  const now = new Date()
  now.setHours(0,0,0,0) // Normalize to start of day

  const pending = revisions.filter(r => {
    const next = new Date(r.nextDate)
    next.setHours(0,0,0,0)
    return next <= now
  })
  
  const upcoming = revisions.filter(r => {
    const next = new Date(r.nextDate)
    next.setHours(0,0,0,0)
    return next > now
  })

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f9fafb', marginBottom: '6px' }}>Revisões Agendadas</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Repetição espaçada para nunca mais esquecer o conteúdo.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-neon" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <Plus size={18} /> Nova Revisão
        </button>
      </div>

      <div className="grid-cols-responsive-main">
        
        {/* PENDING / LATE REVISIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> Pendentes e Atrasadas ({pending.length})
          </h2>
          
          {loading ? (
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          ) : pending.length === 0 ? (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(132,204,22,0.1)', color: '#84cc16', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f9fafb' }}>Tudo em dia!</h3>
              <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Você não tem nenhuma revisão pendente.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pending.map(r => (
                <motion.div whileHover={{ y: -2 }} key={r.id} className="glass-card" style={{ padding: '20px', borderLeft: `4px solid ${r.subject.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '6px', background: `${r.subject.color}20`, color: r.subject.color, fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {r.subject.icon && SUBJECT_ICONS[r.subject.icon as IconName] ? SUBJECT_ICONS[r.subject.icon as IconName] : <BookOpen size={12} />}
                          {r.subject.name}
                        </span>
                        {isPast(new Date(r.nextDate)) && !isToday(new Date(r.nextDate)) && (
                          <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Atrasada</span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f9fafb', marginBottom: '4px' }}>{r.title}</h3>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>
                        Agendada para {format(new Date(r.nextDate), "dd 'de' MMM", { locale: ptBR })} (Ciclo: {r.completedCount + 1})
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button onClick={() => handleComplete(r.id)} style={{ padding: '8px 16px', borderRadius: '8px', background: '#84cc16', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', boxShadow: '0 0 12px rgba(132,204,22,0.3)' }}>
                        <CheckCircle2 size={16} /> Revisado
                      </button>
                      <button onClick={() => handleDelete(r.id)} style={{ padding: '6px', background: 'none', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* UPCOMING REVISIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={18} /> Próximas Revisões ({upcoming.length})
          </h2>
          
          <div className="glass-card" style={{ padding: '24px' }}>
            {upcoming.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>Nenhuma revisão agendada para o futuro.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {upcoming.slice(0, 10).map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db', marginBottom: '4px' }}>{r.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.subject.color }} />
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{r.subject.name}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f9fafb' }}>{format(new Date(r.nextDate), "dd MMM", { locale: ptBR })}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Daqui a {r.intervalDays} dias</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setShowModal(false)} />
            
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '32px', zIndex: 1 }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f9fafb', marginBottom: '20px' }}>Agendar Revisão</h2>
              
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', display: 'block' }}>Conteúdo Estudado (Ex: Crase, Leis de Newton)</label>
                  <input autoFocus type="text" className="input-glass" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Tópico..." />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', display: 'block' }}>Matéria</label>
                  <select className="input-glass" value={newSubject} onChange={e => setNewSubject(e.target.value)}>
                    <option value="">Selecione...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', gap: '8px' }}>
                    <Clock size={16} color="#84cc16" />
                    <span>A primeira revisão será agendada para <strong>Amanhã</strong> (Intervalo de 1 dia). Ao completar, os intervalos aumentarão automaticamente.</span>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancelar</button>
                  <button type="submit" className="btn-neon" style={{ flex: 1, padding: '12px' }}>Agendar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
