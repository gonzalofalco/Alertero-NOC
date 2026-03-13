import { useState, useEffect } from 'react'
import { alertsApi } from './api'
import Dashboard from './components/Dashboard'
import AlertCard from './components/AlertCard'
import AlertsTable from './components/AlertsTable'
import AlertDetail from './components/AlertDetail'

function App() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [viewMode, setViewMode] = useState('cards')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : true
  })
  const [filters, setFilters] = useState({
    status: 'firing',
    showAcked: true,
    showSilenced: false
  })
  
  // 🆕 MEJORAS: Búsqueda, ordenamiento y notificaciones
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date') // date, severity, technology
  const [newAlertsCount, setNewAlertsCount] = useState(0)
  const [lastAlertCount, setLastAlertCount] = useState(0)

  // Guardar preferencia dark mode
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.parse(darkMode))
  }, [darkMode])

  const fetchData = async () => {
    try {
      const [alertsData, statsData] = await Promise.all([
        alertsApi.getCurrent(filters),
        alertsApi.getStats()
      ])
      
      // 🆕 Detectar nuevas alertas firing
      const firingCount = alertsData.items.filter(a => a.status === 'firing').length
      if (lastAlertCount > 0 && firingCount > lastAlertCount) {
        setNewAlertsCount(firingCount - lastAlertCount)
        // Auto-reset contador después de 5 segundos
        setTimeout(() => setNewAlertsCount(0), 5000)
      }
      setLastAlertCount(firingCount)
      
      setAlerts(alertsData.items)
      setStats(statsData)
      setError(null)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // 🆕 MEJORA: Reducido de 30seg a 5seg para tiempo real
    const interval = setInterval(() => {
      fetchData()
    }, 5000)
    return () => clearInterval(interval)
  }, [filters])

  const handleAcknowledge = async (fingerprint, note) => {
    try {
      await alertsApi.acknowledge(fingerprint, note)
      fetchData()
    } catch (err) {
      console.error('Error acknowledging alert:', err)
    }
  }

  const handleDashboardClick = (filterType, value) => {
    if (filterType === 'severity') {
      setFilters({ ...filters, severity: value })
    } else if (filterType === 'status') {
      setFilters({ ...filters, status: value })
    }
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      showAcked: true,
      showSilenced: false
    })
  }

  const quickFilter = filters.status || filters.severity

  // 🆕 MEJORA: Función de búsqueda
  const filteredAlerts = alerts.filter(alert => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      alert.alertname?.toLowerCase().includes(search) ||
      alert.instance?.toLowerCase().includes(search) ||
      alert.labels?.description?.toLowerCase().includes(search) ||
      alert.labels?.system_name?.toLowerCase().includes(search) ||
      alert.labels?.grupo?.toLowerCase().includes(search)
    )
  })

  // 🆕 MEJORA: Función de ordenamiento
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.starts_at) - new Date(a.starts_at)
      case 'severity':
        const severityOrder = { critical: 3, warning: 2, info: 1 }
        return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
      case 'technology':
        const techOrder = { acceso_hfc: 1, acceso_ftth: 2, core: 3, transmision: 4 }
        const techA = a.labels?.oym || ''
        const techB = b.labels?.oym || ''
        return (techOrder[techA] || 99) - (techOrder[techB] || 99)
      default:
        return 0
    }
  })

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <nav className="sticky top-0 z-50 border-b overflow-hidden relative">
        {/* Fondo con gradiente animado */}
        <div className={`absolute inset-0 ${
          darkMode 
            ? 'bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900' 
            : 'bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50'
        } animate-gradient`}></div>
        
        {/* Ondas animadas flotantes */}
        <div className="absolute inset-0 opacity-70">
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
        
        <div className={`relative backdrop-blur-lg transition-colors duration-300 ${
          darkMode ? 'border-gray-800' : 'border-gray-200 shadow-sm'
        }`}>
          <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3">
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                </svg>
                {/* 🆕 MEJORA: Badge de nuevas alertas */}
                {newAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-bold">
                      {newAlertsCount}
                    </span>
                  </span>
                )}
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Alertero
                </h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Monitoring Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`flex items-center rounded-lg p-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <button 
                  onClick={() => setViewMode('cards')} 
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === 'cards' 
                      ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') 
                      : (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button 
                  onClick={() => setViewMode('table')} 
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === 'table' 
                      ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') 
                      : (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              <button 
                onClick={() => setFilters({...filters, status: filters.status === 'firing' ? '' : 'firing'})}
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
                className={`p-2.5 rounded-lg transition-all ${
                  darkMode 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' 
                    : 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
                }`}
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
                onClick={fetchData} 
                className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                  darkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium text-xs">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Dashboard 
          stats={stats} 
          darkMode={darkMode} 
          onFilterClick={handleDashboardClick} 
        />
        
        {/* 🆕 MEJORA: Barra de búsqueda y ordenamiento */}
        <div className={`mb-6 flex flex-wrap gap-3 items-center ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } p-4 rounded-xl border`}>
          {/* Búsqueda */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por alerta, equipo, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Ordenamiento */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Ordenar:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="date">Más recientes</option>
              <option value="severity">Severidad</option>
              <option value="technology">Tecnología</option>
            </select>
          </div>
          
          {/* Contador de resultados */}
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {sortedAlerts.length} de {alerts.length} alertas
          </div>
        </div>
        
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
        
        {loading && alerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Cargando alertas...
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedAlerts.length === 0 ? (
                  <div className={`col-span-full text-center py-12 rounded-xl ${
                    darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
                  }`}>
                    <div className="text-6xl mb-4">
                      {searchTerm ? '🔍' : '🎉'}
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {searchTerm ? 'Sin resultados' : 'No hay alertas'}
                    </h3>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {searchTerm ? 'Probá con otros términos de búsqueda' : 'Todo está funcionando correctamente'}
                    </p>
                  </div>
                ) : (
                  sortedAlerts.map((alert) => (
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
                alerts={sortedAlerts} 
                selectedAlert={selectedAlert} 
                setSelectedAlert={setSelectedAlert} 
                darkMode={darkMode} 
              />
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
