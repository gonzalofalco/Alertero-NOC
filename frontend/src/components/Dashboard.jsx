export default function Dashboard({ stats, darkMode, onFilterClick }) {
  if (!stats) return null

  const metrics = [
    {
      label: 'TOTAL ALERTS',
      value: stats.total || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      colorFrom: darkMode ? 'from-blue-600' : 'from-blue-500',
      colorTo: darkMode ? 'to-indigo-700' : 'to-indigo-600',
      glowColor: 'shadow-blue-500/50',
      neonGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
      iconBg: darkMode ? 'bg-white/90' : 'bg-white/90',
      textColor: "text-white", iconColor: "text-blue-600"
    },
    {
      label: 'CRITICAL',
      value: stats.critical || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      colorFrom: darkMode ? 'from-red-600' : 'from-red-500',
      colorTo: darkMode ? 'to-rose-700' : 'to-rose-600',
      glowColor: 'shadow-red-500/50',
      neonGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]',
      iconBg: darkMode ? 'bg-white/90' : 'bg-white/90',
      textColor: "text-white", iconColor: "text-red-600",
      clickable: true,
      filter: { severity: 'critical', status: 'firing' }
    },
    {
      label: 'WARNINGS',
      value: stats.warning || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorFrom: darkMode ? 'from-yellow-600' : 'from-yellow-500',
      colorTo: darkMode ? 'to-amber-700' : 'to-amber-600',
      glowColor: 'shadow-yellow-500/50',
      neonGlow: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]',
      iconBg: darkMode ? 'bg-white/90' : 'bg-white/90',
      textColor: "text-white", iconColor: "text-yellow-600",
      clickable: true,
      filter: { severity: 'warning', status: 'firing' }
    },
    {
      label: 'FIRING',
      value: stats.firing || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
      colorFrom: darkMode ? 'from-orange-600' : 'from-orange-500',
      colorTo: darkMode ? 'to-red-700' : 'to-red-600',
      glowColor: 'shadow-orange-500/50',
      neonGlow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]',
      iconBg: darkMode ? 'bg-white/90' : 'bg-white/90',
      textColor: "text-white", iconColor: "text-orange-600",
      clickable: true,
      filter: { status: 'firing' }
    },
    {
      label: 'RESOLVED',
      value: stats.resolved || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorFrom: darkMode ? 'from-green-600' : 'from-green-500',
      colorTo: darkMode ? 'to-emerald-700' : 'to-emerald-600',
      glowColor: 'shadow-green-500/50',
      neonGlow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]',
      iconBg: darkMode ? 'bg-white/90' : 'bg-white/90',
      textColor: "text-white", iconColor: "text-green-600",
      clickable: true,
      filter: { status: 'resolved' }
    },
    {
      label: 'ACKNOWLEDGED',
      value: stats.acked || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      colorFrom: darkMode ? 'from-blue-600' : 'from-blue-500',
      colorTo: darkMode ? 'to-cyan-700' : 'to-cyan-600',
      glowColor: 'shadow-cyan-500/50',
      neonGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]',
      iconBg: darkMode ? 'bg-white/90' : 'bg-white/90',
      textColor: "text-white", iconColor: "text-cyan-600"
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          onClick={() => metric.clickable && onFilterClick(metric.filter)}
          className={`
            group relative overflow-hidden rounded-2xl shadow-lg
            backdrop-blur-xl bg-white/10
            transform transition-all duration-500 ease-out
            ${metric.clickable ? 'cursor-pointer hover:scale-[1.08] hover:-translate-y-2' : ''}
            hover:shadow-2xl
            border border-white/20 hover:border-white/40
          `}
          style={{
            animation: `fadeInUp 0.6s ease-out ${idx * 0.1}s both`,
          }}
        >
          {/* Gradient layer behind glass */}
          <div className={`absolute inset-0 bg-gradient-to-br ${metric.colorFrom} ${metric.colorTo} opacity-80 group-hover:opacity-90 transition-opacity duration-500`}></div>
          
          {/* Glass effect layer */}
          <div className="absolute inset-0 backdrop-blur-md bg-white/5"></div>
          
          {/* Neon glow border effect */}
          <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${metric.neonGlow}`}></div>
          
          {/* Animated shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent transform rotate-12 group-hover:animate-shine"></div>
          </div>
          
          {/* Particle sparkles */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-white/60 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse"></div>
          <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="absolute top-6 right-12 w-1 h-1 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse" style={{animationDelay: '0.4s'}}></div>
          
          {/* Floating orbs */}
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-5">
            {/* Icon con backdrop */}
            <div className="flex items-center justify-between mb-3">
              <div className={`${metric.iconBg} backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-white/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                <div className={metric.iconColor}>
                  {metric.icon}
                </div>
              </div>
              {metric.clickable && (
                <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-500">
                  <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Value con efecto glow y bounce */}
            <div className={`text-3xl font-black mb-1 ${metric.textColor} drop-shadow-2xl group-hover:scale-110 transition-all duration-500 ease-out`}>
              {metric.value}
            </div>
            
            {/* Label mejorado */}
            <div className={`text-xs font-bold uppercase tracking-wider ${metric.textColor} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}>
              {metric.label}
            </div>
          </div>
          
          {/* Bottom accent line with pulse */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:h-1.5 group-hover:via-white/60 transition-all duration-300"></div>
          
          {/* Breathing glow effect */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${metric.colorFrom} ${metric.colorTo} opacity-0 group-hover:opacity-20 blur-xl group-hover:animate-pulse`}></div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shine {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
          }
        }
        
        .animate-shine {
          animation: shine 1.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
