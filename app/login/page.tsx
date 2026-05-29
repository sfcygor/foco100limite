'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, EyeOff, Zap, Target, TrendingUp, Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Email ou senha incorretos')
      } else {
        toast.success('Login realizado com sucesso!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(132,204,22,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-10%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(132,204,22,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '44px', height: '44px',
              background: 'linear-gradient(135deg, #84cc16, #65a30d)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={24} color="#0b0f17" fill="#0b0f17" />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f9fafb', letterSpacing: '-0.5px' }}>FOCO</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#84cc16', letterSpacing: '2px', marginTop: '-4px' }}>100LIMITE</div>
            </div>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '14px', fontStyle: 'italic' }}>
            "Quem não mede, não evolui."
          </p>
        </div>

        <div>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#f9fafb', lineHeight: 1.2, marginBottom: '20px' }}>
            Disciplina é a ponte entre{' '}
            <span style={{ color: '#84cc16' }}>metas</span> e conquistas.
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '16px', lineHeight: 1.7, marginBottom: '40px' }}>
            Sistema premium de produtividade para concurseiros e candidatos militares. Meça seu progresso, controle seus estudos e evolua todos os dias.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { icon: Target, label: 'Metas Semanais', desc: 'Defina e acompanhe' },
              { icon: TrendingUp, label: 'Métricas Avançadas', desc: 'Evolua com dados' },
              { icon: Shield, label: 'Cronômetro Pomodoro', desc: 'Foco máximo' },
              { icon: Zap, label: 'Ranking & Conquistas', desc: 'Gamificação total' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <Icon size={16} color="#84cc16" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f9fafb' }}>{label}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { label: 'Usuários', value: '100%' },
            { label: 'Gratuito', value: 'Sempre' },
            { label: 'Módulos', value: '10+' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#84cc16' }}>{value}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px', height: '40px',
                background: 'linear-gradient(135deg, #84cc16, #65a30d)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={20} color="#0b0f17" fill="#0b0f17" />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#f9fafb' }}>FOCO 100LIMITE</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '40px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#f9fafb', marginBottom: '8px' }}>
                Bem-vindo de volta
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                Entre na sua conta e continue evoluindo
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                  id="login-email"
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
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    id="login-password"
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
                id="login-submit"
                style={{ width: '100%', padding: '13px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Não tem uma conta?{' '}
                <Link href="/register" style={{ color: '#84cc16', fontWeight: 600, textDecoration: 'none' }}>
                  Cadastre-se gratuitamente
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
