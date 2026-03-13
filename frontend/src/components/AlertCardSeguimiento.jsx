export default function AlertCardSeguimiento({ alert, onClick, darkMode }) {
  
  const getTechnology = (alert) => {
    const labels = alert.labels || {}
    if (labels.tecnologia) return labels.tecnologia.toUpperCase()
    if (labels.oym) {
      const oym = labels.oym.toLowerCase()
      if (oym === 'acceso_hfc' || oym.includes('hfc')) return 'HFC'
      if (oym === 'acceso_ftth' || oym.includes('ftth')) return 'FTTH'
      if (oym === 'core' || oym.includes('core')) return 'CORE'
      if (oym === 'transmision' || oym.includes('transmision')) return 'TX'
    }
    const alertLower = alert.alertname.toLowerCase()
    if (alertLower.includes('hfc')) return 'HFC'
    if (alertLower.includes('ftth')) return 'FTTH'
    if (alertLower.includes('core')) return 'CORE'
    return null
  }

  const getTechBackground = (tech, darkMode) => {
    const configs = {
      HFC: {
        bg: darkMode ? 'bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950' : 'bg-gradient-to-br from-purple-50 via-white to-purple-100',
        border: darkMode ? 'border-purple-700/50' : 'border-purple-300',
        badge: 'bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700',
        glow: 'shadow-purple-500/20'
      },
      FTTH: {
        bg: darkMode ? 'bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950' : 'bg-gradient-to-br from-teal-50 via-white to-teal-100',
        border: darkMode ? 'border-teal-700/50' : 'border-teal-300',
        badge: 'bg-gradient-to-b from-teal-400 via-teal-600 to-teal-700',
        glow: 'shadow-teal-500/20'
      },
      CORE: {
        bg: darkMode ? 'bg-gradient-to-br from-orange-950 via-orange-900 to-orange-950' : 'bg-gradient-to-br from-orange-50 via-white to-orange-100',
        border: darkMode ? 'border-orange-700/50' : 'border-orange-300',
        badge: 'bg-gradient-to-b from-orange-400 via-orange-600 to-orange-700',
        glow: 'shadow-orange-500/20'
      },
      TX: {
        bg: darkMode ? 'bg-gradient-to-br from-green-950 via-green-900 to-green-950' : 'bg-gradient-to-br from-green-50 via-white to-green-100',
        border: darkMode ? 'border-green-700/50' : 'border-green-300',
        badge: 'bg-gradient-to-b from-green-400 via-green-600 to-green-700',
        glow: 'shadow-green-500/20'
      }
    }
    return configs[tech] || null
  }

  const getSeverityConfig = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'critical':
        return {
          bg: darkMode ? 'bg-gradient-to-br from-red-950 via-red-900 to-red-950' : 'bg-gradient-to-br from-red-50 via-white to-red-100',
          border: darkMode ? 'border-red-700/50' : 'border-red-300',
          text: darkMode ? 'text-red-400' : 'text-red-700',
          badge: 'bg-gradient-to-b from-red-400 via-red-600 to-red-700',
          glow: 'shadow-red-500/20',
          icon: '🔴',
          label: 'CRITICAL'
        }
      case 'warning':
        return {
          bg: darkMode ? 'bg-gradient-to-br from-yellow-950 via-yellow-900 to-yellow-950' : 'bg-gradient-to-br from-yellow-50 via-white to-yellow-100',
          border: darkMode ? 'border-yellow-700/50' : 'border-yellow-300',
          text: darkMode ? 'text-yellow-400' : 'text-yellow-700',
          badge: 'bg-gradient-to-b from-yellow-400 via-yellow-600 to-yellow-700',
          glow: 'shadow-yellow-500/20',
          icon: '⚠️',
          label: 'WARNING'
        }
      case 'info':
        return {
          bg: darkMode ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950' : 'bg-gradient-to-br from-blue-50 via-white to-blue-100',
          border: darkMode ? 'border-blue-700/50' : 'border-blue-300',
          text: darkMode ? 'text-blue-400' : 'text-blue-700',
          badge: 'bg-gradient-to-b from-blue-400 via-blue-600 to-blue-700',
          glow: 'shadow-blue-500/20',
          icon: 'ℹ️',
          label: 'INFO'
        }
      default:
        return {
          bg: darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100',
          border: darkMode ? 'border-gray-700/50' : 'border-gray-300',
          text: darkMode ? 'text-gray-400' : 'text-gray-700',
          badge: 'bg-gradient-to-b from-gray-500 via-gray-600 to-gray-700',
          glow: 'shadow-gray-500/20',
          icon: '📋',
          label: 'UNKNOWN'
        }
    }
  }

  const getDateTime = (date) => {
    const d = new Date(date)
    const dateStr = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    return `${dateStr} ${timeStr}`
  }

  const technology = getTechnology(alert)
  const techBg = getTechBackground(technology, darkMode)
  const severityConfig = getSeverityConfig(alert.severity)
  
  const cardBg = techBg ? techBg.bg : severityConfig.bg
  const cardBorder = techBg ? techBg.border : severityConfig.border
  const cardGlow = techBg ? techBg.glow : severityConfig.glow
  const lateralBadge = techBg ? techBg.badge : severityConfig.badge
  const isFiring = alert.status?.toLowerCase() === 'firing'

  return (
    <div
      onClick={() => onClick(alert)}
      className={`group relative cursor-pointer rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 transition-all duration-500 ease-out
        hover:shadow-2xl hover:shadow-lg ${cardGlow} hover:-translate-y-2 hover:scale-[1.03] hover:rotate-[0.5deg]
        ${cardBg} ${cardBorder}
        backdrop-blur-md bg-white/10 dark:bg-gray-900/30 shadow-xl
      `}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-shimmer"></div>
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl ${lateralBadge} shadow-lg`}></div>
      
      <div className="p-6 pl-8 flex flex-col h-full min-h-[220px]">
        {/* HEADER: Status + Tecnología + ACK | Fecha */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status FIRING/RESOLVED */}
            {isFiring ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-2xl ring-2 ring-white/30 text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30">
                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                FIRING
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-2xl ring-2 ring-white/30 text-xs font-bold bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30">
                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                RESOLVED
              </span>
            )}

            {/* Tecnología */}
            {technology && (
              <span className={`group/tech relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-white shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden ${
                technology === 'FTTH' ? 'bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 shadow-teal-500/50' :
                technology === 'CORE' ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-orange-500/50' :
                technology === 'HFC' ? 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 shadow-purple-500/50' :
                technology === 'TX' ? 'bg-gradient-to-br from-green-400 via-green-500 to-green-600 shadow-green-500/50' :
                'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 shadow-blue-500/50'
              }`}>
                {/* Brillo animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/tech:translate-x-full transition-transform duration-700"></div>
                
                {/* Icono SVG premium */}
                <svg className="w-3.5 h-3.5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {technology === 'HFC' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  )}
                  {technology === 'FTTH' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  )}
                  {technology === 'CORE' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  )}
                  {technology === 'TX' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  )}
                </svg>
                
                <span className="relative z-10 tracking-wider">{technology}</span>
              </span>
            )}

            {/* ACK */}
            {alert.acked && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white shadow-md">
                ✓ ACK
              </span>
            )}
          </div>
          
          {/* Fecha */}
          <span className={`text-xs font-mono px-3 py-1.5 rounded-lg whitespace-nowrap ${darkMode ? 'bg-black/20 text-gray-300' : 'bg-white/60 text-gray-600'}`}>
            {getDateTime(alert.starts_at)}
          </span>
        </div>

        {/* TÍTULO */}
        <div className="mb-4 flex-grow">
          <h3 className={`font-bold text-xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-blue-400 transition-colors`}>
            {alert.alertname}
          </h3>
          {/* Mostrar la nota de reconocimiento */}
          {alert.ack_note && (
            <div className="mt-4 relative group/note">
              <div className={`relative overflow-hidden rounded-2xl border-2 backdrop-blur-xl transition-all duration-300 ${
                technology === 'FTTH' ? (darkMode ? 'bg-gradient-to-br from-teal-900/40 via-teal-800/30 to-teal-900/40 border-teal-500/40 shadow-lg shadow-teal-500/20' : 'bg-gradient-to-br from-teal-50 via-white to-teal-100 border-teal-400 shadow-lg shadow-teal-300/30') :
                technology === 'CORE' ? (darkMode ? 'bg-gradient-to-br from-orange-900/40 via-orange-800/30 to-orange-900/40 border-orange-500/40 shadow-lg shadow-orange-500/20' : 'bg-gradient-to-br from-orange-50 via-white to-orange-100 border-orange-400 shadow-lg shadow-orange-300/30') :
                technology === 'HFC' ? (darkMode ? 'bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 border-purple-500/40 shadow-lg shadow-purple-500/20' : 'bg-gradient-to-br from-purple-50 via-white to-purple-100 border-purple-400 shadow-lg shadow-purple-300/30') :
                technology === 'TX' ? (darkMode ? 'bg-gradient-to-br from-green-900/40 via-green-800/30 to-green-900/40 border-green-500/40 shadow-lg shadow-green-500/20' : 'bg-gradient-to-br from-green-50 via-white to-green-100 border-green-400 shadow-lg shadow-green-300/30') :
                (darkMode ? 'bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-blue-900/40 border-blue-500/40 shadow-lg shadow-blue-500/20' : 'bg-gradient-to-br from-blue-50 via-white to-blue-100 border-blue-400 shadow-lg shadow-blue-300/30')
              }`}>
                {/* Efecto de brillo animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/note:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative px-4 py-3">
                  {/* Header con etiqueta */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      technology === 'FTTH' ? 'bg-teal-500 text-white' :
                      technology === 'CORE' ? 'bg-orange-500 text-white' :
                      technology === 'HFC' ? 'bg-purple-500 text-white' :
                      technology === 'TX' ? 'bg-green-500 text-white' :
                      'bg-blue-500 text-white'
                    } shadow-md`}>
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      Nota de Seguimiento
                    </div>
                    {alert.acked_by && (
                      <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`}>
                        Usuario: {alert.acked_by}
                      </span>
                    )}
                  </div>
                  
                  {/* Contenido de la nota */}
                  <div className={`flex items-start gap-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    <div className={`flex-shrink-0 p-2 rounded-xl ${
                      technology === 'FTTH' ? 'bg-teal-500/20' :
                      technology === 'CORE' ? 'bg-orange-500/20' :
                      technology === 'HFC' ? 'bg-purple-500/20' :
                      technology === 'TX' ? 'bg-green-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        technology === 'FTTH' ? 'text-teal-400' :
                        technology === 'CORE' ? 'text-orange-400' :
                        technology === 'HFC' ? 'text-purple-400' :
                        technology === 'TX' ? 'text-green-400' :
                        'text-blue-400'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium leading-relaxed flex-1 mt-1.5">
                      "{alert.ack_note}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER: Team + Instance */}
        <div className={`flex items-center gap-2 flex-wrap pt-4 border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
          {alert.team && (
            <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              👥 {alert.team.toUpperCase()}
            </span>
          )}

          {alert.instance && (
            <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-mono ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              🖥️ {alert.instance.substring(0, 35)}{alert.instance.length > 35 ? '...' : ''}
            </span>
          )}

          {/* Labels: HUB, System Name, Puerto */}
          {alert.labels?.HUB && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs ${darkMode ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-700/40' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
              📍 {alert.labels.HUB}
            </span>
          )}
          {(alert.labels?.system_name || alert.labels?.['system-name.keyword'] || alert.labels?.['system-name']) && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs ${darkMode ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/40' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
              💻 {alert.labels?.system_name || alert.labels?.['system-name.keyword'] || alert.labels?.['system-name']}
            </span>
          )}
          {(alert.labels?.port_port_id || alert.labels?.puerto || alert.labels?.port) && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs ${darkMode ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              🔌 {alert.labels?.port_port_id || alert.labels?.puerto || alert.labels?.port}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
