import { useState, useEffect } from 'react'
import { alertsApi, incidentsApi } from './api'
import Dashboard from './components/Dashboard'
import AlertCard from './components/AlertCard'
import AlertCardSeguimiento from './components/AlertCardSeguimiento'
import AlertsTable from './components/AlertsTable'
import AlertDetail from './components/AlertDetail'
import IncidentCard from './components/IncidentCard'

function getPortalUsername() {
  try {
    const match = document.cookie.match(/portal_token=([^;]+)/)
    if (!match) return 'usuario'
    const payload = JSON.parse(atob(match[1].split('.')[1]))
    return payload.username || 'usuario'
  } catch {
    return 'usuario'
  }
}

function App() {
  const [alerts, setAlerts] = useState([])
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [viewMode, setViewMode] = useState('cards')
  const [activeTab, setActiveTab] = useState('alerts')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : true
  })
  const [filters, setFilters] = useState({
    status: 'firing',
    severity: '',
    team: '',
    alertname: '',
    show_acked: false,
    show_silenced: false
  })
  const [quickFilter, setQuickFilter] = useState(null)
  const [activeIncident, setActiveIncident] = useState(null)
  const [incidentHistory, setIncidentHistory] = useState([])
  const [updateIntervalLabel, setUpdateIntervalLabel] = useState('Cuanto haya novedades')
  const [updateCountdown, setUpdateCountdown] = useState('')

  const getStoredUpdateInterval = (incidentId) => {
    if (!incidentId) return null
    return localStorage.getItem(`incident_update_interval_${incidentId}`)
  }

  const getIntervalMinutes = (label) => {
    if (label === '1 hora') return 60
    if (label === '3 horas') return 180
    if (label === '6 horas') return 360
    return null
  }

  const fetchIncident = async () => {
    try {
      const response = await incidentsApi.getActive()
      setActiveIncident(response.data)
    } catch {
      setActiveIncident(null)
    }
  }

  const handleActivateIncident = async (title, message, intervalLabel) => {
    const response = await incidentsApi.create({ title, message, created_by: getPortalUsername() })
    const createdIncident = response?.data
    if (createdIncident?.id && intervalLabel) {
      localStorage.setItem(`incident_update_interval_${createdIncident.id}`, intervalLabel)
    }
    await fetchIncident()
  }

  const handleFinalizeIncident = async (id) => {
    await incidentsApi.finalize(id, { finalized_by: getPortalUsername() })
    if (id) {
      localStorage.removeItem(`incident_update_interval_${id}`)
    }
    await fetchIncident()
  }

  const handleAddIncidentUpdate = async (id, message) => {
    await incidentsApi.addUpdate(id, { message, created_by: getPortalUsername() })
    await fetchIncident()
  }

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    fetchAlerts()
    fetchStats()
    fetchIncident()
    const interval = setInterval(() => {
      fetchAlerts()
      fetchStats()
      fetchIncident()
    }, 5000)
    return () => clearInterval(interval)
  }, [filters, activeTab])

  useEffect(() => {
    if (!activeIncident) {
      setUpdateIntervalLabel('Cuanto haya novedades')
      setUpdateCountdown('')
      return
    }
    const storedLabel = getStoredUpdateInterval(activeIncident.id)
    setUpdateIntervalLabel(storedLabel || 'Cuanto haya novedades')
  }, [activeIncident])

  useEffect(() => {
    if (!activeIncident) return
    const minutes = getIntervalMinutes(updateIntervalLabel)
    if (!minutes) {
      setUpdateCountdown(updateIntervalLabel)
      return
    }

    const startedAt = new Date(activeIncident.created_at).getTime()
    const durationMs = minutes * 60 * 1000

    const formatCountdown = (ms) => {
      const clamped = Math.max(0, ms)
      const hours = Math.floor(clamped / 3600000)
      const mins = Math.floor((clamped % 3600000) / 60000)
      const secs = Math.floor((clamped % 60000) / 1000)
      const pad = (value) => String(value).padStart(2, '0')
      return `${pad(hours)}:${pad(mins)}:${pad(secs)}`
    }

    const tick = () => {
      const remainingMs = durationMs - (Date.now() - startedAt)
      setUpdateCountdown(formatCountdown(remainingMs))
    }

    tick()
    const timerId = setInterval(tick, 1000)
    return () => clearInterval(timerId)
  }, [activeIncident, updateIntervalLabel])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      // Si status es null, no enviamos el filtro (para ver todas las alertas)
      // Si está vacío o undefined, usar 'firing' por defecto
      let statusToUse = filters.status
      if (statusToUse === undefined || statusToUse === '') {
        statusToUse = 'firing'
      }
      
      const params = {
        show_acked: filters.show_acked,
        show_silenced: filters.show_silenced
      }
      
      // Solo agregar status si no es null (null significa "todas las alertas")
      if (statusToUse !== null) {
        params.status = statusToUse
      }
      
      if (filters.severity) params.severity = filters.severity
      if (filters.team) params.team = filters.team
      if (filters.alertname) params.alertname = filters.alertname

      console.log('Fetching with params:', params)
      console.log('Current filters:', filters)

      const response = await alertsApi.getCurrent(params)
      setAlerts(response.data.items || [])
      
      // Fetch acknowledged alerts for Seguimiento tab
      const ackedResponse = await alertsApi.getCurrent({ show_acked: true })
      const acked = (ackedResponse.data.items || []).filter(a => a.acked)
      setAcknowledgedAlerts(acked)
      
      setError(null)
    } catch (err) {
      setError('Error cargando alertas: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await alertsApi.getStats()
      setStats(response.data)
    } catch (err) {
      console.error('Error cargando stats:', err)
    }
  }

  const handleAcknowledge = async (alert, note) => {
    console.log('App.handleAcknowledge llamado', { fingerprint: alert.fingerprint, note })
    try {
      const result = await alertsApi.acknowledge(alert.fingerprint, { 
        acked_by: getPortalUsername(),
        note: note 
      })
      console.log('Alerta reconocida exitosamente', result)
      await fetchAlerts()
      setSelectedAlert(null)
      setActiveTab('seguimiento')
      console.log('Redirigido a seguimiento')
    } catch (err) {
      console.error('Error al reconocer alerta:', err)
      window.alert('Error al reconocer alerta: ' + err.message)
    }
  }

  const handleDashboardClick = (filter) => {
    // Limpiar filtros anteriores y aplicar solo el nuevo
    // Si no hay status en el filter, mantener 'firing' como default
    setFilters({
      status: filter.status || 'firing',
      severity: filter.severity || '',
      team: '',
      alertname: '',
      show_acked: false,
      show_silenced: false
    })
    setQuickFilter(filter)
  }

  const clearFilters = () => {
    setFilters({
      status: 'firing',
      severity: '',
      team: '',
      alertname: '',
      show_acked: false,
      show_silenced: false
    })
    setQuickFilter(null)
  }

  const tabs = [
    { 
      id: 'alerts', 
      name: 'Alertas', 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
        </svg>
      ),
      badge: stats?.total_firing || 0,
      badgeColor: 'bg-orange-500',
      available: true
    },
    { 
      id: 'seguimiento', 
      name: 'Seguimiento', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      badge: acknowledgedAlerts.length || 0,
      badgeColor: 'bg-blue-500',
      available: true
    },
    { 
      id: 'analytics', 
      name: 'Deepfield', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      available: false
    },
    { 
      id: 'config', 
      name: 'Incidentes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.11-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      badge: activeIncident ? 1 : 0,
      badgeColor: 'bg-red-600',
      available: true
    },
    { 
      id: 'logs', 
      name: 'Historial', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      available: false
    },
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-100 via-purple-50 to-blue-50'}`}>
      <nav className="sticky top-0 z-50 border-b overflow-hidden relative">
        {/* Fondo con gradiente animado */}
        <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900' : 'bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50'}`}></div>
        
        {/* Ondas animadas flotantes */}
        <div className="absolute inset-0 opacity-60">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor: darkMode ? '#3b82f6' : '#60a5fa', stopOpacity: 0.8}} />
                <stop offset="100%" style={{stopColor: darkMode ? '#a855f7' : '#c084fc', stopOpacity: 0.8}} />
              </linearGradient>
            </defs>
            <ellipse className="wave-1" cx="20%" cy="50%" rx="500" ry="100" fill="url(#grad1)" />
            <ellipse className="wave-2" cx="60%" cy="50%" rx="450" ry="90" fill={darkMode ? 'rgba(99, 102, 241, 0.5)' : 'rgba(96, 165, 250, 0.6)'} />
            <ellipse className="wave-3" cx="85%" cy="50%" rx="300" ry="60" fill={darkMode ? 'rgba(168, 85, 247, 0.5)' : 'rgba(192, 132, 252, 0.6)'} />
          </svg>
        </div>
        
        <div className={`relative backdrop-blur-lg transition-colors duration-300 ${darkMode ? 'border-gray-800' : 'border-gray-200 shadow-sm'}`}>
          {/* Header principal */}
          <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                </svg>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Alertero</h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Monitoring Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`flex items-center rounded-lg p-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <button 
                  onClick={() => setViewMode('cards')} 
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewMode === 'cards' ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') : (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button 
                  onClick={() => setViewMode('table')} 
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewMode === 'table' ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') : (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              <button 
                onClick={() => setFilters({...filters, status: filters.status === 'firing' ? null : 'firing'})}
                className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                  filters.status === 'firing' 
                    ? (darkMode ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white')
                    : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                }`}
              >
                {filters.status === 'firing' ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium text-xs">Solo Activas</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium text-xs">Todas</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className={`p-2.5 rounded-lg transition-all ${darkMode ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' : 'bg-gray-800 hover:bg-gray-700 text-yellow-400'}`}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                  </svg>
                )}
              </button>
              
              <button 
                onClick={() => { fetchAlerts(); fetchStats(); }} 
                className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>

          {/* Navegación por tabs */}
          <div className="relative px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => tab.available && setActiveTab(tab.id)}
                  disabled={!tab.available}
                  className={`
                    relative group flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-300
                    ${activeTab === tab.id 
                      ? (darkMode ? 'text-white' : 'text-gray-900')
                      : tab.available
                        ? (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800')
                        : (darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                    }
                    ${!tab.available && 'opacity-50'}
                  `}
                >
                  <div className={`
                    transition-all duration-300
                    ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}
                  `}>
                    {tab.icon}
                  </div>
                  <span>{tab.name}</span>
                  
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`
                      ${tab.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full
                      ${activeTab === tab.id ? 'animate-pulse' : ''}
                    `}>
                      {tab.badge}
                    </span>
                  )}
                  
                  {!tab.available && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                      Próximamente
                    </span>
                  )}
                  
                  {/* Indicador de tab activo */}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-t-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 blur-sm"></div>
                    </div>
                  )}
                  
                  {/* Hover effect */}
                  {tab.available && activeTab !== tab.id && (
                    <div className={`
                      absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity
                      ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}
                    `}></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeIncident && (
          <div className="mb-4">
            <div className={`incident-ticker ${darkMode ? 'incident-ticker-dark' : 'incident-ticker-light'}`}>
              <div className="incident-ticker-mask">
                <div className="incident-ticker-track">
                  {[0, 1].map((dup) => (
                    <span className="incident-ticker-group" key={dup}>
                      <span className="incident-ticker-pill">
                        <span className="incident-ticker-dot"></span>
                        Incidente activo
                      </span>
                      <span className="incident-ticker-title">{activeIncident.title}</span>
                      <span className="incident-ticker-sep">•</span>
                      <span className="incident-ticker-pill">Actualizar en:</span>
                      <span className="incident-ticker-title">{updateCountdown}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'alerts' && (
          <>
            <Dashboard stats={stats} darkMode={darkMode} onFilterClick={handleDashboardClick} />
            
            {quickFilter && (
              <div className="mb-4 flex items-center gap-2">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Filtro activo:
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                  {quickFilter.severity && `Severity: ${quickFilter.severity}`}
                  {quickFilter.status && `Status: ${quickFilter.status}`}
                  <button 
                    onClick={clearFilters} 
                    className="ml-2 hover:bg-blue-700 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              </div>
            )}
            
            {error && (
              <div className="mb-6 bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            {loading && alerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cargando alertas...</p>
              </div>
            ) : (
              <>
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alerts.length === 0 ? (
                      <div className={`col-span-full text-center py-12 rounded-xl ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                        <div className="text-6xl mb-4">🎉</div>
                        <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          No hay alertas
                        </h3>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Todo está funcionando correctamente
                        </p>
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <AlertCard 
                          key={alert.fingerprint} 
                          alert={alert} 
                          onClick={setSelectedAlert} 
                          darkMode={darkMode} 
                        />
                      ))
                    )}
                  </div>
                ) : (
                  <AlertsTable 
                    alerts={alerts} 
                    selectedAlert={selectedAlert} 
                    setSelectedAlert={setSelectedAlert} 
                    darkMode={darkMode} 
                  />
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <div className={`text-center py-24 rounded-3xl ${darkMode ? 'bg-gray-900/50 border border-gray-800' : 'bg-white/50 border border-gray-200'} backdrop-blur-md`}>
            <div className="text-6xl mb-6">📊</div>
            <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Analytics
            </h2>
            <p className={`text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Estadísticas históricas y tendencias de alertas
            </p>
            <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Próximamente</span>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="flex justify-center pt-8 min-h-[70vh]">
            <div className="w-full max-w-4xl">
              <IncidentCard
                incident={activeIncident}
                onActivate={handleActivateIncident}
                onFinalize={handleFinalizeIncident}
                onAddUpdate={handleAddIncidentUpdate}
                darkMode={darkMode}
              />
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className={`text-center py-24 rounded-3xl ${darkMode ? 'bg-gray-900/50 border border-gray-800' : 'bg-white/50 border border-gray-200'} backdrop-blur-md`}>
            <div className="text-6xl mb-6">📝</div>
            <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Historial
            </h2>
            <p className={`text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Registro de eventos y cambios en el sistema
            </p>
            <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Próximamente</span>
            </div>
          </div>
        )}

        {activeTab === 'seguimiento' && (
          <>
            {loading && acknowledgedAlerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cargando seguimiento...</p>
              </div>
            ) : (
              <>
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {acknowledgedAlerts.length === 0 ? (
                      <div className={`col-span-full text-center py-12 rounded-xl ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          No hay alertas en seguimiento
                        </h3>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Las alertas reconocidas aparecerán aquí
                        </p>
                      </div>
                    ) : (
                      acknowledgedAlerts.map((alert) => (
                        <AlertCardSeguimiento 
                          key={alert.fingerprint} 
                          alert={alert} 
                          onClick={setSelectedAlert} 
                          darkMode={darkMode} 
                        />
                      ))
                    )}
                  </div>
                ) : (
                  <AlertsTable 
                    alerts={acknowledgedAlerts} 
                    selectedAlert={selectedAlert} 
                    setSelectedAlert={setSelectedAlert} 
                    darkMode={darkMode} 
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {selectedAlert && (
        <AlertDetail 
          alert={selectedAlert} 
          onClose={() => setSelectedAlert(null)} 
          onAcknowledge={handleAcknowledge} 
          darkMode={darkMode} 
        />
      )}
    </div>
  )
}

export default App
