import { Router } from 'express'
const router = Router()
router.get('/', (req, res) => res.json({ message: 'Content endpoint' }))
export { router as contentRoutes }
