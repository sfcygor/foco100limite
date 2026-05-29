'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  LayoutDashboard, BookOpen, Timer, Calendar, BarChart2, 
  FileText, Trophy, Medal, User, LogOut, Menu, X
} from 'lucide-react'
import Image from 'next/image'
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
            border: '1px solid var(--color-border)', borderRadius: '10px',
            padding: '10px', color: 'var(--color-text-primary)', cursor: 'pointer'
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
          background: 'linear-gradient(180deg, rgba(90, 0, 255, 0.08) 0%, rgba(15, 5, 24, 0.8) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 12px',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 100,
        }}
      >
        {isMobile && (
          <button onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        )}

        {/* Logo */}
        <div style={{ padding: '8px 10px 24px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              filter: 'drop-shadow(0 0 8px rgba(123,44,255,0.5))', flexShrink: 0,
            }}>
              <Image 
                src="/logo.png" 
                alt="Foco 100Limite Logo" 
                width={36} 
                height={36} 
                style={{ objectFit: 'contain', width: 'auto', height: 'auto' }} 
                priority 
                unoptimized 
              />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>FOCO</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--color-cyan-light)', letterSpacing: '2px', marginTop: '-2px' }}>100LIMITE</div>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '10px', fontStyle: 'italic', paddingLeft: '2px' }}>
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
                    background: '#00C2FF', boxShadow: '0 0 8px rgba(0,194,255,0.6)',
                  }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile & Logout */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'var(--color-bg-card)', marginBottom: '8px' }}>
            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
              {getInitials(userName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName || 'Usuário'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderRadius: '10px',
              border: 'none', background: 'none', color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </motion.aside>
    </>
  )
}
