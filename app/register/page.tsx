'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erro ao criar conta')
        return
      }

      toast.success('Conta criada com sucesso!')

      // Auto-login after register
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-8">
      <div style={{ position: 'fixed', top: '20%', right: '10%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(132,204,22,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '5%', width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(132,204,22,0.04) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none' }} />

      <div className="w-full max-w-md">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '44px', height: '44px',
              background: 'linear-gradient(135deg, #84cc16, #65a30d)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={24} color="#0b0f17" fill="#0b0f17" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f9fafb' }}>FOCO</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#84cc16', letterSpacing: '2px', marginTop: '-4px' }}>100LIMITE</div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '40px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f9fafb', marginBottom: '8px' }}>
              Crie sua conta gratuita
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              Comece a medir seu progresso agora mesmo
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d1d5db', marginBottom: '8px' }}>
                Nome completo
              </label>
              <input
                type="text"
                className="input-glass"
                placeholder="João Silva"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                id="register-name"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d1d5db', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                className="input-glass"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                id="register-email"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d1d5db', marginBottom: '8px' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-glass"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  id="register-password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-neon"
              disabled={loading}
              id="register-submit"
              style={{ width: '100%', padding: '13px', fontSize: '15px', marginTop: '4px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Criando conta...' : 'Criar conta gratuita'}
            </button>
          </form>

          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(132,204,22,0.06)', borderRadius: '10px', border: '1px solid rgba(132,204,22,0.12)' }}>
            <p style={{ fontSize: '12px', color: '#84cc16', textAlign: 'center' }}>
              ✨ 100% gratuito • Sem cartão de crédito • Sem limites
            </p>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Já tem uma conta?{' '}
              <Link href="/login" style={{ color: '#84cc16', fontWeight: 600, textDecoration: 'none' }}>
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
