import { useState, useEffect } from 'react'

export default function AlertDetail({ alert, onClose, onAcknowledge, darkMode }) {
  const [ackNote, setAckNote] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setShowModal(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleClose = () => {
    setShowModal(false)
    setTimeout(() => {
      if (onClose) onClose()
    }, 300)
  }

  const handleAcknowledge = () => {
    console.log('handleAcknowledge llamado', { ackNote, hasNote: !!ackNote.trim() })
    if (!ackNote.trim()) {
      alert('Por favor, ingresa una nota antes de reconocer la alerta.')
      return
    }
    if (onAcknowledge) {
      console.log('Llamando onAcknowledge con:', alert.fingerprint, ackNote)
      onAcknowledge(alert, ackNote)
      setAckNote('')
      handleClose()
    } else {
      console.error('onAcknowledge no está definido')
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const getTechnology = (alert) => {
    const labels = alert.labels || {}
    if (labels.tecnologia) return labels.tecnologia.toUpperCase()
    if (labels.oym) {
      const oym = labels.oym.toLowerCase()
      if (oym.includes('hfc')) return 'HFC'
      if (oym.includes('ftth')) return 'FTTH'
      if (oym.includes('core')) return 'CORE'
      if (oym.includes('transmision')) return 'TX'
    }
    const alertLower = alert.alertname.toLowerCase()
    if (alertLower.includes('hfc')) return 'HFC'
    if (alertLower.includes('ftth')) return 'FTTH'
    if (alertLower.includes('core')) return 'CORE'
    return null
  }

  const getTechConfig = (tech) => {
    const configs = {
      HFC: {
        gradient: 'from-purple-600 via-purple-700 to-purple-800',
        glow: 'shadow-purple-500/30',
        badge: 'bg-gradient-to-r from-purple-600 to-purple-700',
        ring: 'ring-purple-500/50',
        icon: '🔌'
      },
      FTTH: {
        gradient: 'from-teal-600 via-teal-700 to-teal-800',
        glow: 'shadow-teal-500/30',
        badge: 'bg-gradient-to-r from-teal-600 to-teal-700',
        ring: 'ring-teal-500/50',
        icon: '🌐'
      },
      CORE: {
        gradient: 'from-orange-600 via-orange-700 to-orange-800',
        glow: 'shadow-orange-500/30',
        badge: 'bg-gradient-to-r from-orange-600 to-orange-700',
        ring: 'ring-orange-500/50',
        icon: '⚡'
      },
      TX: {
        gradient: 'from-green-600 via-green-700 to-green-800',
        glow: 'shadow-green-500/30',
        badge: 'bg-gradient-to-r from-green-600 to-green-700',
        ring: 'ring-green-500/50',
        icon: '📡'
      }
    }
    return configs[tech] || {
      gradient: 'from-gray-600 via-gray-700 to-gray-800',
      glow: 'shadow-gray-500/30',
      badge: 'bg-gradient-to-r from-gray-600 to-gray-700',
      ring: 'ring-gray-500/50',
      icon: '📋'
    }
  }

  const getSeverityBadge = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'critical':
        return { bg: 'bg-gradient-to-r from-red-600 to-red-700', text: 'CRITICAL', icon: '🔴' }
      case 'warning':
        return { bg: 'bg-gradient-to-r from-yellow-600 to-yellow-700', text: 'WARNING', icon: '⚠️' }
      case 'info':
        return { bg: 'bg-gradient-to-r from-blue-600 to-blue-700', text: 'INFO', icon: 'ℹ️' }
      default:
        return { bg: 'bg-gradient-to-r from-gray-600 to-gray-700', text: 'UNKNOWN', icon: '📋' }
    }
  }

  const technology = getTechnology(alert)
  const techConfig = getTechConfig(technology)
  const severityBadge = getSeverityBadge(alert.severity)
  const isFiring = alert.status?.toLowerCase() === 'firing'

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${showModal ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop con blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl transform transition-all duration-300 ${showModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'} ${darkMode ? 'bg-gray-900' : 'bg-white'} overflow-hidden`}>
        
        {/* Header con gradiente según tecnología */}
        <div className={`relative bg-gradient-to-r ${techConfig.gradient} text-white p-6 ${techConfig.glow} shadow-xl rounded-t-3xl`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
          
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              {/* Badges superiores */}
              <div className="flex items-center gap-2 mb-3">
                {/* Status Badge */}
                {isFiring ? (
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl ring-2 ring-white/30 text-sm font-bold bg-red-600 text-white shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                    FIRING
                  </span>
                ) : (
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl ring-2 ring-white/30 text-sm font-bold bg-green-600 text-white shadow-lg">
                    <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    RESOLVED
                  </span>
                )}

                {/* Severity Badge */}
                <span className={`inline-flex items-center px-4 py-2 rounded-2xl ring-2 ring-white/30 text-sm font-bold ${severityBadge.bg} text-white shadow-lg`}>
                  <span className="mr-1.5">{severityBadge.icon}</span>
                  {severityBadge.text}
                </span>

                {/* Technology Badge */}
                {technology && (
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl ring-2 ring-white/30 text-sm font-bold bg-white/20 backdrop-blur-sm text-white shadow-lg">
                    <span className="mr-1.5">{techConfig.icon}</span>
                    {technology}
                  </span>
                )}

                {/* ACK Badge */}
                {alert.acked && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-500 text-white shadow-md">
                    ✓ ACK
                  </span>
                )}
              </div>

              {/* Título de la alerta */}
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                {alert.alertname}
              </h2>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={handleClose}
              className="ml-4 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {/* Información del Equipo */}
          <div className="mb-6 rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500">
            {/* Header con gradiente dinámico según tecnología */}
            <div className={`relative bg-gradient-to-r ${techConfig.gradient} p-4 overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
              <h3 className="text-lg font-bold flex items-center text-white relative z-10">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Información del Equipo
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
              {/* System Name */}
              {alert.labels?.system_name && (
                <div className="group relative p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-400/30 backdrop-blur-sm hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                  <div className="flex items-center gap-2 text-xs font-semibold mb-2 text-blue-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    Equipo
                  </div>
                  <div className={`font-mono text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {alert.labels.system_name}
                  </div>
                </div>
              )}

              {/* Puerto */}
              {(alert.labels?.port_port_id || alert.labels?.puerto || alert.labels?.port) && (
                <div className="group relative p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-400/30 backdrop-blur-sm hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300">
                  <div className="flex items-center gap-2 text-xs font-semibold mb-2 text-emerald-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Puerto
                  </div>
                  <div className={`font-mono text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {alert.labels?.port_port_id || alert.labels?.puerto || alert.labels?.port}
                  </div>
                </div>
              )}

              {/* HUB */}
              {alert.labels?.HUB && (
                <div className="group relative p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border border-cyan-400/30 backdrop-blur-sm hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300">
                  <div className="flex items-center gap-2 text-xs font-semibold mb-2 text-cyan-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    HUB
                  </div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {alert.labels.HUB}
                  </div>
                </div>
              )}

              {/* Área */}
              {alert.labels?.oym && (
                <div className="group relative p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-400/30 backdrop-blur-sm hover:border-orange-400/60 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300">
                  <div className="flex items-center gap-2 text-xs font-semibold mb-2 text-orange-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Área
                  </div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {alert.labels.oym.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Procedimiento/Instrucciones */}
          {(alert.annotations?.message || alert.summary) && (
            <div className="mb-6 rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500">
              {/* Header con gradiente dinámico según tecnología */}
              <div className={`relative bg-gradient-to-r ${techConfig.gradient} p-4 overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                <h3 className="text-lg font-bold flex items-center text-white relative z-10">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Procedimiento
                </h3>
              </div>
              
              <div className="p-5">
                <div className={`text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>
                  {alert.annotations?.message || alert.summary}
                </div>
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="group relative p-4 rounded-xl bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-400/30 backdrop-blur-sm hover:border-gray-400/60 hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300">
              <div className="flex items-center gap-2 text-xs font-semibold mb-2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                INICIO
              </div>
              <div className={`font-mono text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatDate(alert.starts_at)}
              </div>
            </div>

            <div className="group relative p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-600/10 border border-teal-400/30 backdrop-blur-sm hover:border-teal-400/60 hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300">
              <div className="flex items-center gap-2 text-xs font-semibold mb-2 text-teal-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                ACTUALIZACIÓN
              </div>
              <div className={`font-mono text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatDate(alert.updated_at || alert.starts_at)}
              </div>
            </div>
          </div>

          {/* Nota de ACK */}
          {!alert.acked && (
            <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nota <span className="text-red-500">*</span>
              </label>
              <textarea
                value={ackNote}
                onChange={(e) => setAckNote(e.target.value)}
                placeholder="Agregar comentario sobre la resolución..."
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-4 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
                rows="3"
              />
            </div>
          )}
        </div>

        {/* Footer con botón de reconocer */}
        {!alert.acked && (
          <div className={`px-6 border-t rounded-b-3xl ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`} style={{ paddingTop: '0.5rem', paddingBottom: '1rem' }}>
            <button
              onClick={handleAcknowledge}
              disabled={!ackNote.trim()}
              className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-3 ${
                ackNote.trim() 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 cursor-pointer' 
                  : 'bg-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>Reconocer</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
