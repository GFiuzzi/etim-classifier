import { Router } from 'express'

const router = Router()

// Simple auth endpoints for demonstration
router.post('/login', (req, res) => {
  const { username, password } = req.body
  
  // Simple validation (in production, use proper auth)
  if (username === 'admin' && password === 'admin') {
    res.json({
      success: true,
      token: 'demo-token-' + Date.now(),
      user: { username, role: 'admin' }
    })
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    })
  }
})

router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
})

router.get('/status', (req, res) => {
  res.json({
    success: true,
    authenticated: false, // Simplified for demo
    timestamp: new Date().toISOString()
  })
})

export default router