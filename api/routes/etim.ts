import { Router } from 'express'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { etimAPIService } from '../services/etim-api.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// Mock ETIM data - in real implementation this would come from external APIs
const mockETIMData = {
  local: [
    { code: 'EC000001', description: 'Cavo elettrico unipolare', version: '8.0', source: 'local' as const },
    { code: 'EC000002', description: 'Interruttore automatico', version: '8.0', source: 'local' as const },
    { code: 'EC000003', description: 'Presa elettrica', version: '8.0', source: 'local' as const },
    { code: 'EC000004', description: 'Lampada LED', version: '8.0', source: 'local' as const },
    { code: 'EC000005', description: 'Trasformatore di isolamento', version: '8.0', source: 'local' as const }
  ],
  dataset: [
    { code: 'EC010001', description: 'Contattore elettrico', version: '8.0', source: 'dataset' as const },
    { code: 'EC010002', description: 'Relè di protezione', version: '8.0', source: 'dataset' as const },
    { code: 'EC010003', description: 'Quadro elettrico', version: '8.0', source: 'dataset' as const },
    { code: 'EC010004', description: 'Motore elettrico', version: '8.0', source: 'dataset' as const },
    { code: 'EC010005', description: 'Gruppo di continuità', version: '8.0', source: 'dataset' as const }
  ],
  api: [
    { code: 'EC020001', description: 'Sensore di temperatura', version: '8.0', source: 'api' as const },
    { code: 'EC020002', description: 'Valvola di sicurezza', version: '8.0', source: 'api' as const },
    { code: 'EC020003', description: 'Pompa di calore', version: '8.0', source: 'api' as const },
    { code: 'EC020004', description: 'Unità di trattamento aria', version: '8.0', source: 'api' as const },
    { code: 'EC020005', description: 'Ventilatore centrifugo', version: '8.0', source: 'api' as const }
  ]
}

// Search endpoint
router.get('/search', async (req, res) => {
  try {
    const { q, source = 'local', language = 'EN', version = '8.0' } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required'
      })
    }

    const searchTerm = q.toLowerCase()
    const dataSource = source as keyof typeof mockETIMData
    
    let results: Array<{code: string, description: string, version: string, source: 'local' | 'dataset' | 'api'}> = []
    
    try {
      // Try ETIM International API first if source is 'api' or if no results from local/dataset
      if (dataSource === 'api' || (dataSource !== 'local' && results.length === 0)) {
        if (etimAPIService.config.clientId && etimAPIService.config.clientSecret) {
          const apiResults = await etimAPIService.searchClassifications(searchTerm, {
            language: language as string,
            version: version as string,
            limit: 50
          })
          
          // Transform API results to match our format
          if (apiResults && apiResults.data) {
            results = apiResults.data.map((item: any) => ({
              code: item.code || item.etimCode,
              description: item.description || item.shortDescription,
              version: version as string,
              source: 'api' as const
            }))
          }
        }
      }
    } catch (apiError) {
      console.warn('ETIM API search failed, falling back to mock data:', apiError)
    }
    
    // If no API results or API is not configured, use mock data
    if (results.length === 0 && mockETIMData[dataSource]) {
      results = mockETIMData[dataSource].filter(item =>
        item.code.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
      )
    }
    
    // If no results found and not searching in 'local', try local as fallback
    if (results.length === 0 && dataSource !== 'local' && mockETIMData.local) {
      results = mockETIMData.local.filter(item =>
        item.code.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
      )
    }

    res.json({
      success: true,
      data: results,
      source: results.length > 0 && results[0].source === 'api' ? 'api' : dataSource,
      query: searchTerm,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// ETIM API Configuration endpoint
router.get('/config', async (req, res) => {
  try {
    const config = {
      authUrl: process.env.ETIM_AUTH_URL || 'https://etimauth.etim-international.com',
      baseUrl: process.env.ETIM_BASE_URL || 'https://etimapi.etim-international.com',
      scope: process.env.ETIM_SCOPE || 'EtimApi',
      clientId: process.env.ETIM_CLIENT_ID ? 'configured' : 'not_configured',
      clientSecret: process.env.ETIM_CLIENT_SECRET ? 'configured' : 'not_configured',
      status: process.env.ETIM_CLIENT_ID && process.env.ETIM_CLIENT_SECRET ? 'ready' : 'needs_configuration'
    }

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Config error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get all codes from a specific source
router.get('/codes/:source', async (req, res) => {
  try {
    const { source } = req.params
    const dataSource = source as keyof typeof mockETIMData
    
    if (!mockETIMData[dataSource]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data source'
      })
    }

    res.json({
      success: true,
      data: mockETIMData[dataSource],
      source: dataSource,
      count: mockETIMData[dataSource].length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get codes error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get ETIM code details
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params
    
    // Search across all sources
    const allData = [...mockETIMData.local, ...mockETIMData.dataset, ...mockETIMData.api]
    const item = allData.find(item => item.code === code.toUpperCase())

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'ETIM code not found'
      })
    }

    res.json({
      success: true,
      data: item,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get code error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Export data endpoint
router.get('/export', async (req, res) => {
  try {
    const { source = 'all', format = 'json' } = req.query
    
    let data = []
    
    if (source === 'all') {
      data = [...mockETIMData.local, ...mockETIMData.dataset, ...mockETIMData.api]
    } else {
      const dataSource = source as keyof typeof mockETIMData
      data = mockETIMData[dataSource] || []
    }

    if (format === 'csv') {
      const csv = [
        ['Codice ETIM', 'Descrizione', 'Versione', 'Fonte'],
        ...data.map(item => [item.code, item.description, item.version, item.source])
      ].map(row => row.join(',')).join('\n')
      
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename="etim-data.csv"')
      res.send(csv)
    } else {
      res.json({
        success: true,
        data,
        count: data.length,
        source,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

export default router