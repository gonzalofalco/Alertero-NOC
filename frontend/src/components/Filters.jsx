export default function Filters({ filters, setFilters, darkMode }) {
  return (
    <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-colors duration-300 ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <h2 className={`text-lg font-bold mb-5 flex items-center ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        <svg className={`w-5 h-5 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/>
        </svg>
        Filtros
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className={`block text-sm font-bold mb-2 flex items-center ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <svg className={`w-4 h-4 mr-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            Estado
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 transition-all text-sm font-medium ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-900 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-200 focus:border-blue-500'
            }`}
          >
            <option value="">Todos los estados</option>
            <option value="firing">🔥 Firing</option>
            <option value="resolved">✅ Resolved</option>
          </select>
        </div>
        
        <div>
          <label className={`block text-sm font-bold mb-2 flex items-center ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <svg className={`w-4 h-4 mr-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            Severidad
          </label>
          <select
            value={filters.severity}
            onChange={(e) => setFilters({...filters, severity: e.target.value})}
            className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 transition-all text-sm font-medium ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-900 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-200 focus:border-blue-500'
            }`}
          >
            <option value="">Todas las severidades</option>
            <option value="critical">🔴 Critical</option>
            <option value="warning">🟡 Warning</option>
            <option value="info">🔵 Info</option>
          </select>
        </div>
        
        <div>
          <label className={`block text-sm font-bold mb-2 flex items-center ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <svg className={`w-4 h-4 mr-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
            Nombre de Alerta
          </label>
          <input
            type="text"
            value={filters.alertname}
            onChange={(e) => setFilters({...filters, alertname: e.target.value})}
            placeholder="Buscar por nombre..."
            className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 transition-all text-sm ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-900 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-200 focus:border-blue-500'
            }`}
          />
        </div>
      </div>

      <div className="flex items-center gap-6 mt-5 pt-5 border-t border-gray-300 dark:border-gray-600">
        <label className="flex items-center cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={filters.show_acked}
              onChange={(e) => setFilters({...filters, show_acked: e.target.checked})}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 rounded-full transition-colors peer-checked:bg-blue-600 ${
              darkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`}></div>
            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-md"></div>
          </div>
          <span className={`ml-3 text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Mostrar reconocidas</span>
        </label>

        <label className="flex items-center cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={filters.show_silenced}
              onChange={(e) => setFilters({...filters, show_silenced: e.target.checked})}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 rounded-full transition-colors peer-checked:bg-orange-600 ${
              darkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`}></div>
            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-md"></div>
          </div>
          <span className={`ml-3 text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Mostrar silenciadas</span>
        </label>
      </div>
    </div>
  )
}
