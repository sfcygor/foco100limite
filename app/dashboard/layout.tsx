import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0f17' }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: '10%', left: '30%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(132,204,22,0.04) 0%, transparent 60%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '5%', right: '10%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(132,204,22,0.03) 0%, transparent 60%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }} />

      <Sidebar userName={session.user.name} userEmail={session.user.email} />

      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}
