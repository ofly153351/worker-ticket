import { Router } from 'express'
import { uploadImages } from '../../middleware/upload.middleware'
import * as ctrl from './ticket.controller'

const router = Router()

router.get('/', ctrl.list)
router.get('/:id', ctrl.show)
router.post('/', uploadImages, ctrl.create)
router.put('/:id', ctrl.update)
router.patch('/:id/status', ctrl.patchStatus)
router.delete('/:id', ctrl.remove)

export default router
