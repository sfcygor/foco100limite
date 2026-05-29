import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}h ${m}m`
  }
  if (m > 0) {
    return `${m}m ${s}s`
  }
  return `${s}s`
}

export function formatDurationFull(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function secondsToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 10) / 10
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function getMotivationalMessage(progressPercent: number): string {
  if (progressPercent === 0) return 'Comece agora. O primeiro passo é o mais importante.'
  if (progressPercent < 25) return 'Você está abaixo do ritmo. Intensifique!'
  if (progressPercent < 50) return 'Continue! Você está no caminho certo.'
  if (progressPercent < 75) return 'Ótimo progresso! Mantenha o foco.'
  if (progressPercent < 100) return 'Quase lá! Não pare agora.'
  return '🏆 Meta semanal atingida! Você é disciplinado.'
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return days[dayOfWeek]
}

export function getWeekDates(): Date[] {
  const today = new Date()
  const currentDay = today.getDay() // 0=Sun
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((currentDay + 6) % 7))
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function startOfWeek(): Date {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - ((day + 6) % 7) // Mon=0
  const monday = new Date(today)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function startOfMonth(): Date {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), 1)
}

export function startOfYear(): Date {
  const today = new Date()
  return new Date(today.getFullYear(), 0, 1)
}

export function startOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
