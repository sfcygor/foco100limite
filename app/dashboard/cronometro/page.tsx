'use client'

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Play, Pause, RotateCcw, Save, Timer, Coffee, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { SubjectManagerModal, SUBJECT_ICONS, IconName } from '@/components/subjects/SubjectManagerModal'

interface Subject { id: string; name: string; color: string; icon: string }

type Mode = 'stopwatch' | 'pomodoro'

const POMODORO_FOCUS = 25 * 60
const POMODORO_SHORT = 5 * 60
const POMODORO_LONG = 15 * 60

function pad(n: number) { return String(n).padStart(2, '0') }

export default function CronometroPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [mode, setMode] = useState<Mode>('stopwatch')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0) // seconds elapsed (stopwatch) or remaining (pomodoro)
  const [pomodoroPhase, setPomodoroPhase] = useState<'focus' | 'short' | 'long'>('focus')
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [pomodoroFocusMin, setPomodoroFocusMin] = useState(25)
  const [pomodoroShortMin, setPomodoroShortMin] = useState(5)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const totalElapsedRef = useRef<number>(0)
  const [savedSessions, setSavedSessions] = useState<number>(0)
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false)

  const fetchSubjects = () => {
    fetch('/api/subjects').then(r => r.json()).then(setSubjects)
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (mode === 'stopwatch') {
          setElapsed(prev => prev + 1)
        } else {
          setElapsed(prev => {
            if (prev <= 1) {
              // Phase complete
              handlePomodoroComplete()
              return 0
            }
            return prev - 1
          })
        }
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode])

  // Initialize pomodoro timer when switching
  useEffect(() => {
    if (mode === 'pomodoro' && !running) {
      setElapsed(pomodoroFocusMin * 60)
      setPomodoroPhase('focus')
      setPomodoroCount(0)
    } else if (mode === 'stopwatch') {
      setElapsed(0)
    }
  }, [mode])

  function handlePomodoroComplete() {
    setRunning(false)
    if (soundEnabled) playBeep()
    
    if (pomodoroPhase === 'focus') {
      const newCount = pomodoroCount + 1
      setPomodoroCount(newCount)
      if (newCount % 4 === 0) {
        setPomodoroPhase('long')
        setElapsed(POMODORO_LONG)
        toast.success('🎉 4 ciclos completos! Pausa longa merecida.')
      } else {
        setPomodoroPhase('short')
        setElapsed(pomodoroShortMin * 60)
        toast.success('✅ Foco concluído! Descanse um pouco.')
      }
    } else {
      setPomodoroPhase('focus')
      setElapsed(pomodoroFocusMin * 60)
      toast.info('🎯 Pausa encerrada! Hora de focar.')
    }
  }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.8)
    } catch {}
  }

  function handleStart() {
    if (!selectedSubject) { toast.error('Selecione uma matéria antes de iniciar'); return }
    setRunning(true)
  }

  function handlePause() { setRunning(false) }

  function handleReset() {
    setRunning(false)
    if (mode === 'stopwatch') {
      setElapsed(0)
    } else {
      setElapsed(pomodoroFocusMin * 60)
      setPomodoroPhase('focus')
    }
  }

  async function handleSave() {
    const duration = mode === 'stopwatch' ? elapsed : pomodoroCount * pomodoroFocusMin * 60
    if (duration < 10) { toast.error('Duração muito curta para salvar'); return }
    if (!selectedSubject) { toast.error('Selecione uma matéria'); return }

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId: selectedSubject, duration }),
    })
    if (res.ok) {
      toast.success('Sessão salva com sucesso! 🎉')
      setSavedSessions(p => p + 1)
      fetch('/api/achievements', { method: 'POST' })
      if (mode === 'stopwatch') setElapsed(0)
      else { setPomodoroCount(0); setElapsed(pomodoroFocusMin * 60); setPomodoroPhase('focus') }
    }
  }

  const displaySeconds = mode === 'stopwatch' ? elapsed : elapsed
  const h = Math.floor(displaySeconds / 3600)
  const m = Math.floor((displaySeconds % 3600) / 60)
  const s = displaySeconds % 60

  const pomodoroMax = pomodoroPhase === 'focus' ? pomodoroFocusMin * 60 :
    pomodoroPhase === 'short' ? pomodoroShortMin * 60 : POMODORO_LONG
  const pomodoroProgress = mode === 'pomodoro' ? ((pomodoroMax - elapsed) / pomodoroMax) * 100 : 0
  const stopwatchProgress = mode === 'stopwatch' ? Math.min((elapsed / (60 * 60)) * 100, 100) : 0
  const circleProgress = mode === 'stopwatch' ? stopwatchProgress : pomodoroProgress

  // SVG circle
  const r = 110
  const circ = 2 * Math.PI * r
  const dash = (circleProgress / 100) * circ

  const phaseColor = pomodoroPhase === 'focus' ? '#84cc16' : '#06b6d4'

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f9fafb', marginBottom: '6px' }}>Cronômetro</h1>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Meça seu tempo de foco com precisão</p>
      </div>

      <div className="grid-cols-responsive-main" style={{ gap: '24px' }}>
        {/* Timer Main */}
        <div className="glass-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Mode selector */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', padding: '4px',
            background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            {[
              { key: 'stopwatch', label: 'Cronômetro', icon: Timer },
              { key: 'pomodoro', label: 'Pomodoro', icon: Coffee },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { if (!running) setMode(key as Mode) }}
                style={{
                  padding: '8px 20px', borderRadius: '9px', border: 'none', cursor: running ? 'not-allowed' : 'pointer',
                  background: mode === key ? 'rgba(132,204,22,0.2)' : 'none',
                  color: mode === key ? '#84cc16' : '#9ca3af',
                  fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s',
                }}>
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Pomodoro phase indicator */}
          {mode === 'pomodoro' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <span className="badge" style={{ background: pomodoroPhase === 'focus' ? 'rgba(132,204,22,0.15)' : 'rgba(255,255,255,0.05)',
                color: pomodoroPhase === 'focus' ? '#84cc16' : '#6b7280',
                border: `1px solid ${pomodoroPhase === 'focus' ? 'rgba(132,204,22,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                🎯 Foco
              </span>
              <span className="badge" style={{ background: pomodoroPhase !== 'focus' ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)',
                color: pomodoroPhase !== 'focus' ? '#06b6d4' : '#6b7280',
                border: `1px solid ${pomodoroPhase !== 'focus' ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                ☕ Pausa
              </span>
              <span className="badge badge-amber">Ciclos: {pomodoroCount}</span>
            </div>
          )}

          {/* Circular timer */}
          <div style={{ position: 'relative', width: '260px', height: '260px', marginBottom: '32px' }}>
            <svg width="260" height="260" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="130" cy="130" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle cx="130" cy="130" r={r} fill="none"
                stroke={mode === 'pomodoro' ? phaseColor : '#84cc16'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                style={{ transition: 'stroke-dasharray 0.5s ease', filter: `drop-shadow(0 0 8px ${mode === 'pomodoro' ? phaseColor : '#84cc16'}60)` }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                fontSize: '52px', fontWeight: 800, letterSpacing: '-2px',
                color: running ? (mode === 'pomodoro' ? phaseColor : '#84cc16') : '#f9fafb',
                fontVariantNumeric: 'tabular-nums',
                transition: 'color 0.3s',
              }}>
                {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}
              </div>
              {mode === 'stopwatch' && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {(elapsed / 3600).toFixed(2)}h
                </div>
              )}
              {mode === 'pomodoro' && (
                <div style={{ fontSize: '12px', color: pomodoroPhase === 'focus' ? '#84cc16' : '#06b6d4', marginTop: '4px', fontWeight: 600 }}>
                  {pomodoroPhase === 'focus' ? 'FOCO TOTAL' : pomodoroPhase === 'short' ? 'PAUSA CURTA' : 'PAUSA LONGA'}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
            <button onClick={handleReset}
              style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s' }}
              id="timer-reset">
              <RotateCcw size={18} />
            </button>

            <button
              onClick={running ? handlePause : handleStart}
              className={running ? '' : ''}
              style={{
                width: '72px', height: '72px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: running
                  ? 'rgba(239,68,68,0.15)'
                  : 'linear-gradient(135deg, #84cc16, #65a30d)',
                color: running ? '#ef4444' : '#0b0f17',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: running
                  ? '0 0 24px rgba(239,68,68,0.3)'
                  : '0 0 24px rgba(132,204,22,0.4)',
                transition: 'all 0.2s',
              }}
              id="timer-toggle">
              {running ? <Pause size={28} /> : <Play size={28} strokeWidth={2.5} />}
            </button>

            <button onClick={handleSave}
              style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid rgba(132,204,22,0.2)',
                background: 'rgba(132,204,22,0.08)', color: '#84cc16', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s' }}
              id="timer-save">
              <Save size={18} />
            </button>
          </div>

          {savedSessions > 0 && (
            <div className="badge badge-neon">✓ {savedSessions} sessão(ões) salva(s)</div>
          )}
        </div>

        {/* Sidebar Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Subject */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f9fafb' }}>Matéria</h3>
              <button onClick={() => setIsSubjectManagerOpen(true)} style={{ background: 'none', border: 'none', color: '#84cc16', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                <Settings size={14} /> Gerenciar
              </button>
            </div>
            <select className="input-glass" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} id="timer-subject" style={{ width: '100%' }}>
              <option value="">Selecione...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Pomodoro Settings */}
          {mode === 'pomodoro' && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f9fafb', marginBottom: '14px' }}>Configurar Pomodoro</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Foco (min)', value: pomodoroFocusMin, setter: setPomodoroFocusMin },
                  { label: 'Pausa curta (min)', value: pomodoroShortMin, setter: setPomodoroShortMin },
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{label}</div>
                    <input type="number" className="input-glass" value={value}
                      onChange={e => { if (!running) setter(Math.max(1, Math.min(60, parseInt(e.target.value) || 1))) }}
                      min={1} max={60} />
                  </div>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} />
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>Som ao completar ciclo</span>
                </label>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f9fafb', marginBottom: '12px' }}>Como usar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                '1. Selecione a matéria',
                mode === 'stopwatch' ? '2. Clique em Play para iniciar' : '2. Configure os tempos',
                '3. Estude com foco total',
                '4. Clique em 💾 para salvar',
              ].map(t => (
                <p key={t} style={{ fontSize: '12px', color: '#6b7280' }}>{t}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SubjectManagerModal isOpen={isSubjectManagerOpen} onClose={() => setIsSubjectManagerOpen(false)} onSubjectsChange={fetchSubjects} />
    </motion.div>
  )
}
