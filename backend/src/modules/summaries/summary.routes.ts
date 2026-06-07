import { Router } from 'express'
import * as ctrl from './summary.controller'

const router = Router()

router.get('/', ctrl.list)
router.post('/generate', ctrl.generate)
router.get('/:id', ctrl.show)

export default router
