import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function IncidentCard({ incident, onActivate, onFinalize, onAddUpdate, darkMode }) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [updateInterval, setUpdateInterval] = useState('1 hora')
  const [loading, setLoading] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const getDateTime = (date) => {
    const d = new Date(date)
    const dateStr = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    return `${dateStr} ${timeStr}`
  }

  const handleActivate = async () => {
    if (!title.trim() || !message.trim()) return
    setLoading(true)
    await onActivate(title.trim(), message.trim(), updateInterval)
    setTitle('')
    setMessage('')
    setUpdateInterval('1 hora')
    setShowForm(false)
    setLoading(false)
  }

  const handleFinalize = async () => {
    setLoading(true)
    await onFinalize(incident.id)
    setLoading(false)
  }

  const handleAddUpdate = async () => {
    if (!updateMessage.trim()) return
    setUpdateLoading(true)
    await onAddUpdate(incident.id, updateMessage.trim())
    setUpdateMessage('')
    setUpdateLoading(false)
  }

  useEffect(() => {
    if (!showDetails) return
    setShowModal(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDetails])

  const handleCloseDetails = () => {
    setShowModal(false)
    setTimeout(() => setShowDetails(false), 300)
  }

  // Active incident card
  if (incident) {
    const updates = Array.isArray(incident.updates) ? incident.updates : []
    const stopClick = (event) => event.stopPropagation()
    return (
      <div
        onClick={() => setShowDetails(true)}
        className={`incident-urgent group relative cursor-pointer rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 transition-all duration-500 ease-out
        hover:shadow-2xl hover:shadow-lg shadow-red-500/30 hover:-translate-y-2 hover:scale-[1.03]
        ${darkMode ? 'bg-gradient-to-br from-red-950 via-red-900 to-red-950 border-red-700/60' : 'bg-gradient-to-br from-red-50 via-white to-red-100 border-red-300'}
        backdrop-blur-md bg-white/10 dark:bg-gray-900/30 shadow-xl
      `}
      >
        <div className="absolute -inset-2 rounded-[28px] bg-red-500/10 blur-2xl opacity-80 pointer-events-none"></div>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-shimmer pointer-events-none"></div>
        <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-3xl bg-gradient-to-b from-red-400 via-red-600 to-red-700 shadow-lg pointer-events-none"></div>

        <div className="relative z-10 p-6 pl-9 flex flex-col gap-4">
          {/* HEADER */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex justify-start">
              <span className="inline-flex items-center px-4 py-2 rounded-2xl ring-2 ring-white/30 text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30 ml-1">
                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                INCIDENTE ACTIVO
              </span>
            </div>
            <h3 className={`font-black text-2xl text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {incident.title}
            </h3>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs font-mono px-3 py-1.5 rounded-lg whitespace-nowrap ${darkMode ? 'bg-black/20 text-gray-300' : 'bg-white/60 text-gray-600'}`}>
                {getDateTime(incident.created_at)}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                Iniciado por: {incident.created_by}
              </span>
            </div>
          </div>

          {/* MENSAJE INICIAL */}
          <div className={`rounded-2xl p-4 border ${darkMode ? 'bg-black/20 border-red-800/50 text-gray-200' : 'bg-white/70 border-red-200 text-gray-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-red-400 font-bold">Mensaje inicial</p>
            </div>
            <p className="text-sm leading-relaxed">
              {incident.message}
            </p>
          </div>

          {/* ACTUALIZACIONES */}
          <div
            onClick={stopClick}
            className={`rounded-2xl p-4 border ${darkMode ? 'bg-black/20 border-red-800/40' : 'bg-white/70 border-red-200'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs uppercase tracking-widest font-bold ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                Actualizaciones
              </p>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {updates.length} notas
              </span>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto overflow-x-hidden pr-1">
              {updates.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Aun no hay actualizaciones.
                </p>
              ) : (
                updates.map((update, index) => (
                  <div key={update.id || `${update.created_at}-${index}`} className="flex gap-3">
                    <div className="mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {update.created_by}
                        </span>
                        <span className={`text-[11px] font-mono ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {getDateTime(update.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm break-all whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {update.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* NUEVA ACTUALIZACION */}
          <div onClick={stopClick} className="flex flex-col gap-3">
            <textarea
              onClick={stopClick}
              placeholder="Agregar una actualizacion del incidente..."
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              rows={3}
              className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-all ${
                darkMode
                  ? 'bg-gray-800/80 text-white placeholder-gray-500 border border-gray-700 focus:border-red-500'
                  : 'bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-red-500'
              }`}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={(event) => { stopClick(event); handleFinalize() }}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Finalizar Incidente
              </button>
              <button
                onClick={(event) => { stopClick(event); handleAddUpdate() }}
                disabled={updateLoading || !updateMessage.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar actualizacion
              </button>
            </div>
          </div>
        </div>
        {showDetails && typeof document !== 'undefined' && createPortal(
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${showModal ? 'opacity-100' : 'opacity-0'}`}>
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
              onClick={handleCloseDetails}
            />
            <div
              onClick={stopClick}
              className={`relative w-full max-w-5xl min-h-[60vh] max-h-[92vh] rounded-3xl border shadow-2xl transform transition-all duration-300 ${
                showModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
              } ${
                darkMode
                  ? 'bg-gray-900 border-red-800/60 text-gray-100'
                  : 'bg-white border-red-200 text-gray-900'
              } overflow-hidden`}
            >
              <div className="relative bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white p-6 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold">Incidente activo</p>
                    <h3 className="text-2xl font-black">{incident.title}</h3>
                  </div>
                  <button
                    onClick={handleCloseDetails}
                    className="ml-4 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                    aria-label="Cerrar"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[calc(92vh-190px)] px-6 py-6 space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    Iniciado por: {incident.created_by}
                  </span>
                  <span className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {getDateTime(incident.created_at)}
                  </span>
                </div>
                <div className={`rounded-2xl p-4 border ${darkMode ? 'bg-black/20 border-red-800/50 text-gray-200' : 'bg-red-50/50 border-red-200 text-gray-800'}`}>
                  <p className="text-xs uppercase tracking-widest text-red-400 font-bold mb-2">Mensaje inicial</p>
                  <p className="text-sm leading-relaxed">{incident.message}</p>
                </div>
                <div className={`rounded-2xl p-4 border ${darkMode ? 'bg-black/20 border-red-800/40' : 'bg-white/70 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-xs uppercase tracking-widest font-bold ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                      Actualizaciones
                    </p>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {updates.length} notas
                    </span>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto overflow-x-hidden pr-1">
                    {updates.length === 0 ? (
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Aun no hay actualizaciones.
                      </p>
                    ) : (
                      updates.map((update, index) => (
                        <div key={update.id || `${update.created_at}-${index}`} className="flex gap-3">
                          <div className="mt-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {update.created_by}
                              </span>
                              <span className={`text-[11px] font-mono ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {getDateTime(update.created_at)}
                              </span>
                            </div>
                            <p className={`text-sm break-all whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {update.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    )
  }

  // No active incident - show activation card
  return (
    <div className={`group relative rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 transition-all duration-500 ease-out
      hover:shadow-2xl hover:shadow-lg shadow-gray-500/10
      ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 border-gray-300'}
      backdrop-blur-md bg-white/10 dark:bg-gray-900/30 shadow-xl
    `}>
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-shimmer pointer-events-none"></div>
      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl bg-gradient-to-b from-gray-400 via-gray-500 to-gray-600 shadow-lg pointer-events-none"></div>

      <div className="relative z-10 p-6 pl-8 flex flex-col min-h-[220px]">
        {!showForm ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center px-4 py-2 rounded-2xl ring-2 ring-white/30 text-xs font-bold bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg">
                SIN INCIDENTE
              </span>
            </div>
            <div className="mb-4 flex-grow flex flex-col items-center justify-center">
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No hay incidentes activos en este momento
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activar Incidente
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center px-4 py-2 rounded-2xl ring-2 ring-white/30 text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30">
                NUEVO INCIDENTE
              </span>
              <button
                onClick={() => { setShowForm(false); setTitle(''); setMessage(''); setUpdateInterval('1 hora') }}
                className={`text-xs px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} transition-colors`}
              >
                Cancelar
              </button>
            </div>
            <div className="flex-grow flex flex-col gap-3">
              <input
                type="text"
                placeholder="Título del incidente"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all ${
                  darkMode
                    ? 'bg-gray-800/80 text-white placeholder-gray-500 border border-gray-700 focus:border-red-500'
                    : 'bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-red-500'
                }`}
              />
              <textarea
                placeholder="Descripción del incidente..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-all ${
                  darkMode
                    ? 'bg-gray-800/80 text-white placeholder-gray-500 border border-gray-700 focus:border-red-500'
                    : 'bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-red-500'
                }`}
              />
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Tiempo de actualizacion
                </label>
                <select
                  value={updateInterval}
                  onChange={(e) => setUpdateInterval(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all ${
                    darkMode
                      ? 'bg-gray-800/80 text-white border border-gray-700 focus:border-red-500'
                      : 'bg-white text-gray-900 border border-gray-300 focus:border-red-500'
                  }`}
                >
                  <option value="1 hora">1 hora</option>
                  <option value="3 horas">3 horas</option>
                  <option value="6 horas">6 horas</option>
                  <option value="Cuanto haya novedades">Cuanto haya novedades</option>
                </select>
              </div>
              <button
                onClick={handleActivate}
                disabled={loading || !title.trim() || !message.trim()}
                className="self-end inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirmar Incidente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
