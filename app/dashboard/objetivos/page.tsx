'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, Calendar, GripVertical, Trash2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Subject { id: string; name: string; color: string; icon: string }
interface Objective {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  deadline: string | null
  subject: Subject
}

export default function ObjetivosPage() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newDate, setNewDate] = useState('')

  const [activeId, setActiveId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [objRes, subRes] = await Promise.all([
      fetch('/api/objectives'), fetch('/api/subjects')
    ])
    if (objRes.ok) setObjectives(await objRes.json())
    if (subRes.ok) setSubjects(await subRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newSubject) { toast.error('Título e matéria são obrigatórios'); return }

    const res = await fetch('/api/objectives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, description: newDesc, subjectId: newSubject, deadline: newDate || null })
    })

    if (res.ok) {
      toast.success('Objetivo criado com sucesso!')
      setShowModal(false); setNewTitle(''); setNewDesc(''); setNewSubject(''); setNewDate('')
      fetchData()
    } else {
      const err = await res.json().catch(() => null)
      toast.error(err?.error || 'Ocorreu um erro ao criar o objetivo.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este objetivo?')) return
    
    // Optimistic UI update
    const previousObjectives = [...objectives]
    setObjectives(prev => prev.filter(o => o.id !== id))
    
    const res = await fetch(`/api/objectives/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Objetivo excluído.')
    } else {
      toast.error('Erro ao excluir objetivo.')
      setObjectives(previousObjectives) // Revert on failure
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find containers
    const activeObj = objectives.find(o => o.id === activeId)
    if (!activeObj) return

    const activeContainer = activeObj.status
    let overContainer = ''

    if (['TODO', 'IN_PROGRESS', 'DONE'].includes(overId)) {
      overContainer = overId
    } else {
      const overObj = objectives.find(o => o.id === overId)
      if (overObj) overContainer = overObj.status
    }

    if (!overContainer) return

    if (activeContainer !== overContainer) {
      // Optimistic update
      setObjectives(prev => prev.map(o => o.id === activeId ? { ...o, status: overContainer as any } : o))
      
      // Persist
      await fetch(`/api/objectives/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: overContainer })
      })
    }
  }

  const columns = [
    { id: 'TODO', title: 'A Fazer', color: '#FF8A33' },
    { id: 'IN_PROGRESS', title: 'Em Progresso', color: '#00C2FF' },
    { id: 'DONE', title: 'Concluídos', color: '#7B2CFF' }
  ]

  const activeItem = activeId ? objectives.find(o => o.id === activeId) : null

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '6px' }}>Objetivos e Metas</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Organize seus estudos em um quadro Kanban flexível.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-neon" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <Plus size={18} /> Novo Objetivo
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid-cols-responsive-cards" style={{ minHeight: '60vh' }}>
            {columns.map(col => {
              const colItems = objectives.filter(o => o.status === col.id)
              return (
                <div key={col.id} className="glass-card" style={{ padding: '20px', background: 'rgba(45, 15, 80, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                      {col.title}
                    </h3>
                    <span className="badge" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-muted)' }}>{colItems.length}</span>
                  </div>
                  
                  <DroppableArea id={col.id} items={colItems} onDelete={handleDelete} />
                </div>
              )
            })}
          </div>

          <DragOverlay>
            {activeItem ? <ObjectiveCard objective={activeItem} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modal Novo Objetivo */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setShowModal(false)} />
            
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '32px', zIndex: 1 }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '20px' }}>Novo Objetivo</h2>
              
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block' }}>Título</label>
                  <input autoFocus type="text" className="input-glass" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Fechar edital de Português" />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block' }}>Matéria</label>
                  <select className="input-glass" value={newSubject} onChange={e => setNewSubject(e.target.value)}>
                    <option value="">Selecione...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block' }}>Prazo (opcional)</label>
                  <input type="date" className="input-glass" value={newDate} onChange={e => setNewDate(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block' }}>Descrição (opcional)</label>
                  <textarea className="input-glass" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} placeholder="Detalhes..." />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancelar</button>
                  <button type="submit" className="btn-neon" style={{ flex: 1, padding: '12px' }}>Criar Objetivo</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function DroppableArea({ id, items, onDelete }: { id: string, items: Objective[], onDelete: (id: string) => void }) {
  const { setNodeRef } = useSortable({ id })
  
  return (
    <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '150px' }}>
        {items.map(item => (
          <SortableItem key={item.id} objective={item} onDelete={onDelete} />
        ))}
      </div>
    </SortableContext>
  )
}

function SortableItem({ objective, onDelete }: { objective: Objective, onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: objective.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ObjectiveCard objective={objective} listeners={listeners} attributes={attributes} onDelete={() => onDelete(objective.id)} />
    </div>
  )
}

function ObjectiveCard({ objective, listeners, attributes, isOverlay, onDelete }: any) {
  const isLate = objective.deadline && isPast(new Date(objective.deadline)) && !isToday(new Date(objective.deadline)) && objective.status !== 'DONE'
  
  return (
    <div className="glass-card" style={{ 
      padding: '16px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
      boxShadow: isOverlay ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
      borderLeft: `3px solid ${objective.subject.color}`,
      position: 'relative'
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <button {...attributes} {...listeners} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'grab', padding: 0, marginTop: '2px' }}>
          <GripVertical size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${objective.subject.color}20`, color: objective.subject.color }}>
              {objective.subject.name}
            </span>
            {onDelete && (
              <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7, padding: 0 }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px', lineHeight: 1.4 }}>{objective.title}</h4>
          {objective.description && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {objective.description}
            </p>
          )}
          {objective.deadline && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: isLate ? '#ef4444' : 'var(--color-text-muted)', fontWeight: isLate ? 600 : 400, marginTop: '8px' }}>
              <Calendar size={12} />
              {format(new Date(objective.deadline), "dd/MM/yyyy")}
              {isLate && ' (Atrasado)'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
