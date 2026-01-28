// ETIM International API OAuth2 Configuration
// This configuration matches the official ETIM API documentation

export interface ETIMAPIConfig {
  authUrl: string
  baseUrl: string
  clientId: string
  clientSecret: string
  scope: string
}

export const etimAPIConfig: ETIMAPIConfig = {
  authUrl: process.env.ETIM_AUTH_URL || 'https://etimauth.etim-international.com',
  baseUrl: process.env.ETIM_BASE_URL || 'https://etimapi.etim-international.com',
  clientId: process.env.ETIM_CLIENT_ID || '',
  clientSecret: process.env.ETIM_CLIENT_SECRET || '',
  scope: process.env.ETIM_SCOPE || 'EtimApi'
}

// OAuth2 Token Response Interface
export interface OAuth2TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

// ETIM API Service Class
export class ETIMAPIService {
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(public config: ETIMAPIConfig) {}

  // Get OAuth2 access token
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const tokenUrl = `${this.config.authUrl}/connect/token`
    
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: this.config.scope
    })

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      })

      if (!response.ok) {
        throw new Error(`OAuth2 authentication failed: ${response.status} ${response.statusText}`)
      }

      const tokenData = await response.json() as OAuth2TokenResponse
      this.accessToken = tokenData.access_token
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000 // Refresh 1 minute before expiry

      return this.accessToken
    } catch (error) {
      console.error('Failed to get ETIM API access token:', error)
      throw error
    }
  }

  // Make authenticated API request
  async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken()
    
    const url = `${this.config.baseUrl}${endpoint}`
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      throw new Error(`ETIM API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Search ETIM classifications
  async searchClassifications(query: string, options: {
    language?: string
    version?: string
    limit?: number
  } = {}) {
    const params = new URLSearchParams({
      q: query,
      language: options.language || 'EN',
      version: options.version || '8.0',
      limit: String(options.limit || 50)
    })

    return this.makeRequest(`/api/classifications/search?${params.toString()}`)
  }

  // Get ETIM classification by code
  async getClassification(code: string, options: {
    language?: string
    version?: string
  } = {}) {
    const params = new URLSearchParams({
      language: options.language || 'EN',
      version: options.version || '8.0'
    })

    return this.makeRequest(`/api/classifications/${code}?${params.toString()}`)
  }

  // Get ETIM features for classification
  async getClassificationFeatures(code: string, options: {
    language?: string
    version?: string
  } = {}) {
    const params = new URLSearchParams({
      language: options.language || 'EN',
      version: options.version || '8.0'
    })

    return this.makeRequest(`/api/classifications/${code}/features?${params.toString()}`)
  }
}

// Create singleton instance
export const etimAPIService = new ETIMAPIService(etimAPIConfig)