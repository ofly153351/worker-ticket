import { Router } from 'express'
import * as ctrl from './project.controller'

const router = Router()

router.get('/', ctrl.list)
router.get('/:id', ctrl.show)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)
router.post('/:id/run-summary',     ctrl.runSummary)
router.get('/:id/preview-summary',  ctrl.previewSummary)

export default router
