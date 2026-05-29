'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, Clock, CalendarDays, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { SubjectManagerModal, SUBJECT_ICONS, IconName } from '@/components/subjects/SubjectManagerModal'

interface Subject {
  id: string
  name: string
  color: string
  icon: string
}

export default function RegistrarPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [questions, setQuestions] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [recentSessions, setRecentSessions] = useState<any[]>([])

  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false)

  const fetchSubjects = () => {
    fetch('/api/subjects').then(r => r.json()).then(setSubjects)
  }

  useEffect(() => {
    fetchSubjects()
    fetch('/api/sessions?period=week').then(r => r.json()).then(setRecentSessions)
  }, [])

  const totalSeconds = hours * 3600 + minutes * 60 + seconds

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSubject) { toast.error('Selecione uma matéria'); return }
    if (totalSeconds === 0) { toast.error('Informe a duração do estudo'); return }
    if (correct > questions) { toast.error('Acertos não podem ser maiores que o total'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubject, duration: totalSeconds, questions, correct, date, note }),
      })
      if (res.ok) {
        toast.success('Sessão registrada com sucesso! 🎉')
        fetch('/api/achievements', { method: 'POST' })
        setHours(0); setMinutes(0); setSeconds(0); setQuestions(0); setCorrect(0); setNote('')
        fetch('/api/sessions?period=week').then(r => r.json()).then(setRecentSessions)
      } else {
        toast.error('Erro ao registrar sessão')
      }
    } catch { toast.error('Erro ao registrar sessão') }
    finally { setLoading(false) }
  }

  const totalHours = (totalSeconds / 3600).toFixed(1)
  const acerto = questions > 0 ? Math.round((correct / questions) * 100) : 0

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            Registrar Estudo
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Registre sua sessão de estudos e acompanhe seu progresso</p>
        </div>
        <button onClick={() => setIsSubjectManagerOpen(true)} className="btn-secondary" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <Settings size={16} /> Gerenciar Matérias
        </button>
      </div>

      <div className="grid-cols-responsive-main">
        <div className="glass-card" style={{ padding: '28px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Date */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Data</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="date" className="input-glass" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1 }} />
                <button type="button" onClick={() => setDate(new Date().toISOString().split('T')[0])} style={{ padding: '10px 16px', background: 'rgba(0,194,255,0.1)', border: '1px solid rgba(0,194,255,0.2)', borderRadius: '10px', color: '#00C2FF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                  Hoje
                </button>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Matéria</label>
              <select className="input-glass" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{ width: '100%' }}>
                <option value="">Selecione uma matéria...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Duração do Estudo</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Horas', value: hours, setter: setHours, max: 23 },
                  { label: 'Minutos', value: minutes, setter: setMinutes, max: 59 },
                  { label: 'Segundos', value: seconds, setter: setSeconds, max: 59 },
                ].map(({ label, value, setter, max }) => (
                  <div key={label}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', textAlign: 'center' }}>{label}</div>
                    <input type="number" className="input-glass" value={value} onChange={e => setter(Math.max(0, Math.min(max, parseInt(e.target.value) || 0)))} min={0} max={max} style={{ textAlign: 'center', fontSize: '18px', fontWeight: 700 }} />
                  </div>
                ))}
              </div>
              {totalSeconds > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(0,194,255,0.08)', borderRadius: '8px', border: '1px solid rgba(0,194,255,0.15)' }}>
                  <Clock size={14} color="#00C2FF" />
                  <span style={{ fontSize: '13px', color: '#00C2FF', fontWeight: 600 }}>Total: {totalHours}h ({totalSeconds}s)</span>
                </div>
              )}
            </div>

            {/* Questions */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Questões (opcional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Respondidas</div>
                  <input type="number" className="input-glass" value={questions} onChange={e => setQuestions(Math.max(0, parseInt(e.target.value) || 0))} min={0} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Acertos</div>
                  <input type="number" className="input-glass" value={correct} onChange={e => setCorrect(Math.max(0, Math.min(questions, parseInt(e.target.value) || 0)))} min={0} max={questions} />
                </div>
              </div>
              {questions > 0 && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Taxa de acerto: <span style={{ color: acerto >= 70 ? '#00C2FF' : '#f59e0b', fontWeight: 600 }}>{acerto}%</span></div>
              )}
            </div>

            {/* Note */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Anotações (opcional)</label>
              <textarea className="input-glass" placeholder="O que você estudou? Dificuldades? Pontos importantes..." value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
            </div>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-neon" disabled={loading} style={{ padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Registrando...' : '✓ Registrar Sessão de Estudo'}
            </motion.button>
          </form>
        </div>

        {/* Recent Sessions */}
        <div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CalendarDays size={16} color="#00C2FF" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Sessões desta semana</h3>
            </div>
            {recentSessions.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Nenhuma sessão registrada esta semana.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentSessions.slice(0, 8).map((s: any) => (
                  <motion.div whileHover={{ x: 4 }} key={s.id} style={{ padding: '12px 14px', background: 'var(--color-bg-card)', borderRadius: '10px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${s.subject?.color}20`, color: s.subject?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {s.subject?.icon ? SUBJECT_ICONS[s.subject.icon as IconName] : <BookOpen size={14}/>}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.subject?.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{new Date(s.date).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#00C2FF' }}>{(s.duration / 3600).toFixed(1)}h</div>
                      {s.questions > 0 && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{s.questions}Q</div>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SubjectManagerModal isOpen={isSubjectManagerOpen} onClose={() => setIsSubjectManagerOpen(false)} onSubjectsChange={fetchSubjects} />
    </motion.div>
  )
}
