import Image from 'next/image'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0f17] bg-opacity-90 backdrop-blur-md">
      <div className="relative flex flex-col items-center justify-center">
        {/* Pulsing Glow behind the logo */}
        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--color-purple-light)', filter: 'blur(24px)' }}></div>
        
        <div style={{
          filter: 'drop-shadow(0 0 20px rgba(123,44,255,0.8))',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}>
          <Image 
            src="/logo.png" 
            alt="Carregando..." 
            width={80} 
            height={80} 
            style={{ objectFit: 'contain', width: 'auto', height: 'auto' }}
            priority
            unoptimized
          />
        </div>
        
        <div className="mt-6 text-sm font-bold tracking-[0.2em] text-[var(--color-cyan-light)] uppercase animate-pulse">
          Carregando
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .7; transform: scale(0.95); }
        }
      `}</style>
    </div>
  )
}
