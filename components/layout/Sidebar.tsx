'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  LayoutDashboard, BookOpen, Timer, Calendar, BarChart2, 
  FileText, Trophy, Medal, User, LogOut, Zap, Menu, X
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface SidebarProps {
  userName: string | null | undefined
  userEmail: string | null | undefined
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/registrar', icon: BookOpen, label: 'Registrar Estudo' },
  { href: '/dashboard/cronometro', icon: Timer, label: 'Cronômetro' },
  { href: '/dashboard/cronograma', icon: Calendar, label: 'Cronograma' },
  { href: '/dashboard/desempenho', icon: BarChart2, label: 'Desempenho' },
  { href: '/dashboard/relatorios', icon: FileText, label: 'Relatórios' },
  { href: '/dashboard/revisoes', icon: BookOpen, label: 'Revisões' },
  { href: '/dashboard/objetivos', icon: Trophy, label: 'Objetivos' },
  { href: '/dashboard/ranking', icon: Medal, label: 'Ranking' },
  { href: '/dashboard/conquistas', icon: Medal, label: 'Conquistas' },
  { href: '/dashboard/perfil', icon: User, label: 'Perfil' },
]

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile) setIsOpen(false)
  }, [pathname, isMobile])

  return (
    <>
      {/* Mobile Toggle */}
      {isMobile && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', top: '16px', left: '16px', zIndex: 90,
            background: 'rgba(11,15,23,0.8)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
            padding: '10px', color: '#f9fafb', cursor: 'pointer'
          }}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 95 }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: isMobile ? (isOpen ? 0 : -280) : 0,
          width: 240
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          minHeight: '100vh',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 12px',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 100,
        }}
      >
        {isMobile && (
          <button onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#9ca3af' }}>
            <X size={20} />
          </button>
        )}

        {/* Logo */}
        <div style={{ padding: '8px 10px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', background: 'linear-gradient(135deg, #84cc16, #65a30d)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(132,204,22,0.3)', flexShrink: 0,
            }}>
              <Zap size={18} color="#0b0f17" fill="#0b0f17" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#f9fafb', letterSpacing: '-0.3px' }}>FOCO</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#84cc16', letterSpacing: '2px', marginTop: '-2px' }}>100LIMITE</div>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '10px', fontStyle: 'italic', paddingLeft: '2px' }}>
            "Quem não mede, não evolui."
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', paddingRight: '4px' }}>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
                {isActive && (
                  <motion.div layoutId="sidebar-active-indicator" style={{
                    marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%',
                    background: '#84cc16', boxShadow: '0 0 8px rgba(132,204,22,0.6)',
                  }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile & Logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', marginBottom: '8px' }}>
            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
              {getInitials(userName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName || 'Usuário'}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderRadius: '10px',
              border: 'none', background: 'none', color: '#6b7280', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280' }}
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </motion.aside>
    </>
  )
}
