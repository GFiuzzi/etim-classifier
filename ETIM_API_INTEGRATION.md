# ETIM International API Integration

This project includes full integration with the official ETIM International API using OAuth2 authentication.

## Configuration

The ETIM API configuration follows the official documentation format:

```json
{
  "rest-client.environmentVariables": {
    "production": {
      "authUrl": "https://etimauth.etim-international.com",
      "baseUrl": "https://etimapi.etim-international.com",
      "client_id": "",
      "client_secret": "",
      "scope": "EtimApi"
    }
  }
}
```

## Setup Instructions

1. **Request API Credentials**: Visit [ETIM API Portal](https://etimapi.etim-international.com) to request your `client_id` and `client_secret`

2. **Configure Environment**: Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

3. **Edit .env file**:
   ```
   ETIM_CLIENT_ID=your_actual_client_id
   ETIM_CLIENT_SECRET=your_actual_client_secret
   ```

## API Features

### Available Endpoints

- **Search Classifications**: Search ETIM classifications by keyword
- **Get Classification**: Get detailed information about a specific classification code
- **Get Features**: Get all features for a specific classification
- **Multi-language Support**: Support for multiple languages (EN, DE, FR, etc.)
- **Version Control**: Support for different ETIM versions (8.0, 7.0, etc.)

### Usage Examples

```typescript
import { etimAPIService } from './api/services/etim-api.js'

// Search for electrical components
const results = await etimAPIService.searchClassifications('cavo elettrico', {
  language: 'IT',
  version: '8.0',
  limit: 10
})

// Get specific classification details
const classification = await etimAPIService.getClassification('EC000001', {
  language: 'IT',
  version: '8.0'
})

// Get classification features
const features = await etimAPIService.getClassificationFeatures('EC000001', {
  language: 'IT',
  version: '8.0'
})
```

## OAuth2 Authentication Flow

1. **Token Request**: The service automatically requests an access token using client credentials
2. **Token Storage**: Tokens are cached and automatically refreshed before expiration
3. **Error Handling**: Automatic retry on authentication failures
4. **Security**: All tokens are stored in memory only, never logged or exposed

## Integration with Multi-Source Architecture

The ETIM API integration works seamlessly with the existing multi-source data architecture:

1. **Priority Order**: Local → Dataset → ETIM API
2. **Fallback Mechanism**: If local/dataset sources don't return results, automatically queries ETIM API
3. **Caching**: API results can be cached locally to reduce API calls
4. **Rate Limiting**: Built-in rate limiting to respect API limits

## Error Handling

The API service includes comprehensive error handling:

- **Authentication Errors**: Automatic token refresh on 401 errors
- **Rate Limiting**: Respects rate limits with exponential backoff
- **Network Errors**: Automatic retry with exponential backoff
- **Validation Errors**: Input validation before API calls
- **Timeout Handling**: Configurable timeout for API requests

## Testing

Use the provided REST client configuration for testing:

```bash
# Test with curl
curl -X POST https://etimauth.etim-international.com/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&scope=EtimApi"
```

## Production Deployment

For Ubuntu server deployment:

1. **Secure Storage**: Store credentials in environment variables only
2. **SSL/TLS**: All API calls use HTTPS
3. **Monitoring**: Health check endpoint monitors API connectivity
4. **Logging**: Secure logging without credential exposure
5. **Backup**: Local fallback data in case of API unavailability