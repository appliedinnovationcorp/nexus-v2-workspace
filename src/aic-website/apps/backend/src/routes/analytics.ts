import { Router } from 'express'
const router = Router()
router.get('/', (req, res) => res.json({ message: 'Analytics endpoint' }))
export { router as analyticsRoutes }
