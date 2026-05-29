'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Edit2, Check, BookOpen, Calculator, Globe, Code, PenTool, Activity, AlertTriangle, Briefcase, Zap } from 'lucide-react'
import { toast } from 'sonner'

export const SUBJECT_ICONS = {
  BookOpen: <BookOpen size={16} />,
  Calculator: <Calculator size={16} />,
  Globe: <Globe size={16} />,
  Code: <Code size={16} />,
  PenTool: <PenTool size={16} />,
  Activity: <Activity size={16} />,
  Briefcase: <Briefcase size={16} />,
  Zap: <Zap size={16} />
}
export type IconName = keyof typeof SUBJECT_ICONS

interface Subject {
  id: string
  name: string
  color: string
  icon: string
}

interface SubjectManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubjectsChange?: () => void
}

export function SubjectManagerModal({ isOpen, onClose, onSubjectsChange }: SubjectManagerModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#84cc16')
  const [editIcon, setEditIcon] = useState<IconName>('BookOpen')

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchSubjects = async () => {
    setLoading(true)
    const res = await fetch('/api/subjects')
    if (res.ok) setSubjects(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) fetchSubjects()
  }, [isOpen])

  const handleSave = async (id: string | 'new') => {
    if (!editName.trim()) {
      toast.error('O nome da matéria não pode ser vazio.')
      return
    }

    const isNew = id === 'new'
    const method = isNew ? 'POST' : 'PUT'
    const body = isNew 
      ? { name: editName, color: editColor, icon: editIcon }
      : { id, name: editName, color: editColor, icon: editIcon }

    const res = await fetch('/api/subjects', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      toast.success(isNew ? 'Matéria criada!' : 'Matéria atualizada!')
      setEditingId(null)
      fetchSubjects()
      onSubjectsChange?.()
    } else {
      toast.error('Erro ao salvar matéria.')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/subjects?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Matéria apagada!')
      setDeletingId(null)
      fetchSubjects()
      onSubjectsChange?.()
    } else {
      toast.error('Erro ao apagar matéria.')
    }
  }

  const startEdit = (sub?: Subject) => {
    if (sub) {
      setEditingId(sub.id)
      setEditName(sub.name)
      setEditColor(sub.color)
      setEditIcon(sub.icon as IconName || 'BookOpen')
    } else {
      setEditingId('new')
      setEditName('')
      setEditColor('#84cc16')
      setEditIcon('BookOpen')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="glass-card"
            style={{ position: 'relative', width: '100%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', zIndex: 1 }}
          >
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f9fafb' }}>Gerenciar Matérias</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" style={{ width: '24px', height: '24px' }} /></div>
              ) : (
                <>
                  {subjects.map(sub => (
                    <div key={sub.id} style={{
                      padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)'
                    }}>
                      {editingId === sub.id ? (
                        <EditForm
                          name={editName} setName={setEditName}
                          color={editColor} setColor={setEditColor}
                          icon={editIcon} setIcon={setEditIcon}
                          onSave={() => handleSave(sub.id)}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : deletingId === sub.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                            <AlertTriangle size={16} />
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Excluir esta matéria apagará todo o histórico de estudo associado a ela.</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setDeletingId(null)} className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '13px' }}>Cancelar</button>
                            <button onClick={() => handleDelete(sub.id)} style={{ flex: 1, padding: '8px', fontSize: '13px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Sim, excluir</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${sub.color}20`, color: sub.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {SUBJECT_ICONS[sub.icon as IconName] || <BookOpen size={16} />}
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f9fafb' }}>{sub.name}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => startEdit(sub)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}><Edit2 size={16} /></button>
                            <button onClick={() => setDeletingId(sub.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {editingId === 'new' ? (
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(132,204,22,0.05)', border: '1px solid rgba(132,204,22,0.2)' }}>
                      <EditForm
                        name={editName} setName={setEditName}
                        color={editColor} setColor={setEditColor}
                        icon={editIcon} setIcon={setEditIcon}
                        onSave={() => handleSave('new')}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  ) : (
                    <button onClick={() => startEdit()} style={{
                      padding: '16px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)',
                      background: 'none', color: '#84cc16', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                      <Plus size={16} /> Nova Matéria
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function EditForm({ name, setName, color, setColor, icon, setIcon, onSave, onCancel }: any) {
  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e']
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input autoFocus type="text" className="input-glass" value={name} onChange={e => setName(e.target.value)} placeholder="Nome da matéria..." style={{ padding: '10px' }} />
      
      <div>
        <label style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', display: 'block' }}>Cor</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: '24px', height: '24px', borderRadius: '50%', background: c, border: color === c ? '2px solid #fff' : 'none', cursor: 'pointer'
            }} />
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', display: 'block' }}>Ícone</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.keys(SUBJECT_ICONS).map(k => (
            <button key={k} onClick={() => setIcon(k as IconName)} style={{
              width: '32px', height: '32px', borderRadius: '8px', background: icon === k ? `${color}30` : 'rgba(255,255,255,0.05)',
              color: icon === k ? color : '#9ca3af', border: icon === k ? `1px solid ${color}50` : '1px solid transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {SUBJECT_ICONS[k as IconName]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button onClick={onCancel} className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '13px' }}>Cancelar</button>
        <button onClick={onSave} className="btn-neon" style={{ flex: 1, padding: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Check size={14}/> Salvar</button>
      </div>
    </div>
  )
}
