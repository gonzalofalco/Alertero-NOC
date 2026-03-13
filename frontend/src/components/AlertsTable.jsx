export default function AlertsTable({ alerts, selectedAlert, setSelectedAlert, darkMode }) {
  
  // Extraer tecnología de labels
  const getTechnology = (alert) => {
    const labels = alert.labels || {}
    
    // Detectar tecnología
    if (labels.tecnologia) return labels.tecnologia.toUpperCase()
    if (labels.oym) {
      if (labels.oym.includes('hfc')) return 'HFC'
      if (labels.oym.includes('ftth')) return 'FTTH'
      if (labels.oym.includes('core')) return 'CORE'
      if (labels.oym.includes('transmision')) return 'TX'
    }
    
    // Por alertname
    if (alert.alertname.includes('hfc')) return 'HFC'
    if (alert.alertname.includes('ftth')) return 'FTTH'
    if (alert.alertname.includes('core')) return 'CORE'
    
    return null
  }

  // Estilos por tecnología
  const getTechBadge = (tech, darkMode) => {
    if (!tech) return null
    
    const styles = {
      'HFC': darkMode 
        ? 'bg-purple-900 text-purple-200 ring-2 ring-purple-600' 
        : 'bg-purple-100 text-purple-800 ring-2 ring-purple-400',
      'FTTH': darkMode 
        ? 'bg-cyan-900 text-cyan-200 ring-2 ring-cyan-600' 
        : 'bg-cyan-100 text-cyan-800 ring-2 ring-cyan-400',
      'CORE': darkMode 
        ? 'bg-orange-900 text-orange-200 ring-2 ring-orange-600' 
        : 'bg-orange-100 text-orange-800 ring-2 ring-orange-400',
      'TX': darkMode 
        ? 'bg-green-900 text-green-200 ring-2 ring-green-600' 
        : 'bg-green-100 text-green-800 ring-2 ring-green-400',
    }
    
    const icons = {
      'HFC': '🔌',
      'FTTH': '🌐',
      'CORE': '⚡',
      'TX': '📡'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[tech] || 'bg-gray-600 text-white'}`}>
        <span className="mr-1">{icons[tech]}</span>
        {tech}
      </span>
    )
  }

  const getSeverityStyle = (severity) => {
    if (darkMode) {
      switch(severity) {
        case 'critical': return 'bg-red-900 bg-opacity-40 text-red-300 ring-2 ring-red-600'
        case 'warning': return 'bg-yellow-900 bg-opacity-40 text-yellow-300 ring-2 ring-yellow-600'
        case 'info': return 'bg-blue-900 bg-opacity-40 text-blue-300 ring-2 ring-blue-600'
        default: return 'bg-gray-700 text-gray-300 ring-2 ring-gray-600'
      }
    } else {
      switch(severity) {
        case 'critical': return 'bg-red-100 text-red-800 ring-2 ring-red-400'
        case 'warning': return 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400'
        case 'info': return 'bg-blue-100 text-blue-800 ring-2 ring-blue-400'
        default: return 'bg-gray-100 text-gray-800 ring-2 ring-gray-400'
      }
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'firing') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-lg">
          <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
          FIRING
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white shadow-lg">
        <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
        </svg>
        RESOLVED
      </span>
    )
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  return !alerts || alerts.length === 0 ? (
    <div className={`rounded-2xl shadow-xl p-12 text-center border transition-colors duration-300 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className={`rounded-full p-6 w-20 h-20 mx-auto mb-4 ${
        darkMode ? 'bg-gray-700' : 'bg-gray-100'
      }`}>
        <svg className={`w-8 h-8 mx-auto ${
          darkMode ? 'text-gray-500' : 'text-gray-400'
        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className={`text-lg font-bold mb-2 ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>No hay alertas</h3>
      <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
        No se encontraron alertas que coincidan con los filtros
      </p>
    </div>
  ) : (
    <div className={`rounded-2xl shadow-xl overflow-hidden border transition-colors duration-300 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={darkMode ? 'bg-gray-900' : 'bg-gradient-to-r from-gray-50 to-gray-100'}>
            <tr>
              <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Estado</th>
              <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Severidad</th>
              <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Tipo</th>
              <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Alerta</th>
              <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Instancia</th>
              <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Team</th>
              <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Tiempo</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-100 bg-white'}`}>
            {alerts.map(alert => {
              const technology = getTechnology(alert)
              const isSelected = selectedAlert && selectedAlert.fingerprint === alert.fingerprint
              
              return (
                <tr
                  key={alert.fingerprint}
                  onClick={() => setSelectedAlert(alert)}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? darkMode
                        ? 'bg-blue-900 bg-opacity-30 border-l-4 border-blue-500 scale-[1.01]'
                        : 'bg-blue-50 border-l-4 border-blue-500 scale-[1.01]'
                      : darkMode
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(alert.status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getSeverityStyle(alert.severity)}`}>
                      {alert.severity?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getTechBadge(technology, darkMode)}
                  </td>
                  <td className={`px-4 py-4 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    <div className="font-medium">{alert.alertname}</div>
                    {alert.summary && (
                      <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {alert.summary.substring(0, 60)}{alert.summary.length > 60 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td className={`px-4 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <code className="text-xs">{alert.instance || '-'}</code>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {alert.team && (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {alert.team}
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                      {getTimeAgo(alert.updated_at)}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer con contador */}
      <div className={`px-6 py-4 border-t ${
        darkMode ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Mostrando {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
          </span>
          {selectedAlert && (
            <span className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              ← Alerta seleccionada
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
