import React, { useState, useEffect } from 'react'
import { Search, Settings, Download, Upload, RefreshCw, Database, Globe, HardDrive } from 'lucide-react'

interface ETIMData {
  code: string
  description: string
  version: string
  source: 'local' | 'dataset' | 'api'
}

interface ApiResponse {
  success: boolean
  data?: ETIMData[]
  message?: string
  source: 'local' | 'dataset' | 'api'
}

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<ETIMData[]>([])
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<'local' | 'dataset' | 'api'>('local')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(() => {
        if (searchTerm) {
          handleSearch()
        }
      }, refreshInterval * 1000)
    }
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, searchTerm])

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/etim/search?q=${encodeURIComponent(searchTerm)}&source=${dataSource}`)
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setResults(data.data || [])
      } else {
        console.error('Search failed:', data.message)
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['Codice ETIM', 'Descrizione', 'Versione', 'Fonte'],
      ...results.map(item => [item.code, item.description, item.version, item.source])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `etim-results-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const lines = content.split('\n').filter(line => line.trim())
        const searchTerm = lines[0]?.split(',')[0] || ''
        setSearchTerm(searchTerm)
      } catch (error) {
        console.error('Import error:', error)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Database className="h-8 w-8 text-blue-600" />
              ETIM Classifier - Ubuntu Server
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <HardDrive className="h-4 w-4" />
              <span>Server Ubuntu 24.04</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Search Section */}
            <div className="lg:col-span-3">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Cerca codice ETIM o descrizione..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading || !searchTerm.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Ricerca...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Cerca
                    </>
                  )}
                </button>
              </div>

              {/* Data Source Selection */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium text-gray-700">Fonte dati:</span>
                <div className="flex gap-2">
                  {[
                    { value: 'local', label: 'Locale', icon: HardDrive },
                    { value: 'dataset', label: 'Dataset', icon: Database },
                    { value: 'api', label: 'API', icon: Globe }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setDataSource(value as any)}
                      className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
                        dataSource === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Refresh */}
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Aggiornamento automatico</span>
                </label>
                {autoRefresh && (
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={10}>10 secondi</option>
                    <option value={30}>30 secondi</option>
                    <option value={60}>1 minuto</option>
                    <option value={300}>5 minuti</option>
                  </select>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleExport}
                disabled={results.length === 0}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Esporta CSV
              </button>
              
              <label className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer flex items-center justify-center gap-2">
                <Upload className="h-4 w-4" />
                Importa CSV
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  setSearchTerm('')
                  setResults([])
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Pulisci
              </button>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Risultati ({results.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Codice ETIM</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Descrizione</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Versione</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Fonte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                          {item.code}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {item.description}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {item.version}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.source === 'local' ? 'bg-blue-100 text-blue-800' :
                            item.source === 'dataset' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {item.source === 'local' && <HardDrive className="inline h-3 w-3 mr-1" />}
                            {item.source === 'dataset' && <Database className="inline h-3 w-3 mr-1" />}
                            {item.source === 'api' && <Globe className="inline h-3 w-3 mr-1" />}
                            {item.source}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.length === 0 && searchTerm && !loading && (
            <div className="mt-6 text-center text-gray-500">
              Nessun risultato trovato per "{searchTerm}"
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Server Ubuntu 24.04 - In esecuzione</span>
            </div>
            <div className="text-xs text-gray-500">
              Deploy: Ubuntu Server • Nginx • Node.js • React • TypeScript
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home