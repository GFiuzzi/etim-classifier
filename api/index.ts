import app from './app.js'

const PORT = Number(process.env.PORT) || 3001
const HOST = process.env.HOST || '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`🚀 ETIM Classifier Server running on http://${HOST}:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔧 Health check: http://${HOST}:${PORT}/health`)
})