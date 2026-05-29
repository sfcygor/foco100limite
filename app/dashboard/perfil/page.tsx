'use client'

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { User, Clock, Target, Flame, Save, Upload, Trash2, AlertTriangle, X } from 'lucide-react'
import { getInitials, secondsToHours } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Profile {
  id: string; name: string | null; email: string; weeklyGoalHours: number; createdAt: string; image: string | null
}
interface Stats {
  total: { duration: number; questions: number; sessions: number }
  year: { streak: number; daysStudied: number }
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [name, setName] = useState('')
  const [weeklyGoal, setWeeklyGoal] = useState(20)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Danger Zone
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetting, setResetting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(p => {
      setProfile(p); setName(p.name || ''); setWeeklyGoal(p.weeklyGoalHours || 20)
    })
    fetch('/api/stats').then(r => r.json()).then(setStats)
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body: any = { name, weeklyGoalHours: weeklyGoal }
      if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword }
      
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro ao salvar'); return }
      
      setProfile(prev => prev ? { ...prev, ...data } : prev)
      setCurrentPassword(''); setNewPassword('')
      toast.success('Perfil atualizado com sucesso!')
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = Math.min(img.width, img.height, 400)
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const offsetX = (img.width - size) / 2
          const offsetY = (img.height - size) / 2
          ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)
          
          const base64Image = canvas.toDataURL('image/jpeg', 0.8)
          
          fetch('/api/profile/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
          }).then(res => res.json()).then(data => {
            if (data.success) {
              setProfile(p => p ? { ...p, image: data.image } : p)
              toast.success('Foto atualizada!')
            } else {
              toast.error(data.error || 'Erro ao fazer upload')
            }
          }).finally(() => setUploading(false))
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    fetch('/api/profile/image', { method: 'DELETE' }).then(res => res.json()).then(data => {
      if (data.success) {
        setProfile(p => p ? { ...p, image: null } : p)
        toast.success('Foto removida')
      }
    })
  }

  const handleResetStats = async () => {
    setResetting(true)
    try {
      const res = await fetch('/api/profile/stats', { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao resetar')
      toast.success('Estatísticas zeradas com sucesso!')
      setShowResetModal(false)
      // Refetch stats
      fetch('/api/stats').then(r => r.json()).then(setStats)
    } catch {
      toast.error('Erro ao zerar estatísticas')
    } finally {
      setResetting(false)
    }
  }

  if (!profile) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />)}
    </div>
  }

  const totalHours = stats ? secondsToHours(stats.total.duration) : 0

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f9fafb', marginBottom: '6px' }}>Meu Perfil</h1>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Gerencie suas informações e configurações</p>
      </div>

      <div className="grid-cols-responsive-main">
        {/* Coluna Esquerda: Edição e Danger Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Avatar + Info */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              <div className="group" style={{ position: 'relative' }}>
                <div style={{
                  width: '80px', height: '80px',
                  background: 'linear-gradient(135deg, #84cc16, #65a30d)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: 800, color: '#0b0f17',
                  boxShadow: '0 0 24px rgba(132,204,22,0.3)',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }} onClick={() => fileInputRef.current?.click()}>
                  {profile.image ? (
                    <img src={profile.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : getInitials(profile.name)}
                  
                  {uploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="spinner" style={{ width: '20px', height: '20px' }} />
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={() => fileInputRef.current?.click()} style={{ fontSize: '12px', color: '#84cc16', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <Upload size={14} /> Alterar
                  </button>
                  {profile.image && (
                    <button onClick={removeImage} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <Trash2 size={14} /> Remover
                    </button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f9fafb' }}>{profile.name || 'Usuário'}</div>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>{profile.email}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d1d5db', marginBottom: '8px' }}>Nome</label>
                <input type="text" className="input-glass" value={name} onChange={e => setName(e.target.value)} id="profile-name" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d1d5db', marginBottom: '8px' }}>
                  Meta semanal de horas
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="range" min={5} max={80} step={5} value={weeklyGoal}
                    onChange={e => setWeeklyGoal(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: '#84cc16' }} />
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#84cc16', minWidth: '40px' }}>{weeklyGoal}h</span>
                </div>
              </div>

              <div className="divider" />

              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f9fafb', marginBottom: '-4px' }}>
                Alterar senha (opcional)
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Senha atual</label>
                <input type="password" className="input-glass" value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)} placeholder="Senha atual" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Nova senha</label>
                <input type="password" className="input-glass" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha (mínimo 6 caracteres)" />
              </div>

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-neon" disabled={saving} id="profile-save"
                style={{ padding: '13px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Save size={16} />
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </motion.button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>Zerar Estatísticas</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>Esta ação apagará todo o seu progresso, sessões e conquistas.</p>
              </div>
            </div>
            
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowResetModal(true)}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              <Trash2 size={16} />
              Zerar Estatísticas
            </motion.button>
          </div>
        </div>

        {/* Stats sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { icon: Clock, label: 'Horas totais', value: `${totalHours}h`, color: '#84cc16' },
            { icon: Target, label: 'Questões respondidas', value: stats?.total.questions || 0, color: '#f59e0b' },
            { icon: Flame, label: 'Sequência atual', value: `${stats?.year.streak || 0} dias`, color: '#f97316' },
            { icon: User, label: 'Dias ativos no ano', value: stats?.year.daysStudied || 0, color: '#06b6d4' },
            { icon: Target, label: 'Meta semanal', value: `${weeklyGoal}h`, color: '#8b5cf6' },
          ].map(({ icon: Icon, label, value, color }) => (
            <motion.div whileHover={{ y: -2 }} key={label} className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px',
                background: `${color}18`, border: `1px solid ${color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
              onClick={() => !resetting && setShowResetModal(false)}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card"
              style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '32px', zIndex: 1, border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <button onClick={() => !resetting && setShowResetModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
              
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <AlertTriangle size={28} />
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f9fafb', marginBottom: '8px' }}>
                Zerar todas as estatísticas?
              </h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '32px', lineHeight: 1.5 }}>
                Esta ação <strong style={{ color: '#ef4444' }}>não poderá ser desfeita</strong>. Todas as suas horas estudadas, questões respondidas, gráficos, rankings e conquistas voltarão a zero.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button disabled={resetting} onClick={() => setShowResetModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px', fontSize: '14px' }}>
                  Cancelar
                </button>
                <button disabled={resetting} onClick={handleResetStats} style={{ 
                  flex: 1, padding: '12px', fontSize: '14px', borderRadius: '12px', border: 'none',
                  background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}>
                  {resetting ? <div className="spinner" style={{ width: '16px', height: '16px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : 'Sim, zerar tudo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
