import { Router } from 'express'
import * as ctrl from './config.controller'

const router = Router()

router.get('/models',        ctrl.getModels)
router.get('/meta',          ctrl.getMeta)
router.get('/schedule',           ctrl.getSchedule)
router.put('/schedule',           ctrl.putSchedule)
router.post('/schedule/run',      ctrl.runNow)
router.post('/schedule/test-notify', ctrl.testNotify)
router.get('/next-runs',          ctrl.getNextRuns)
router.get('/hermes',        ctrl.getConfig)
router.put('/hermes',        ctrl.putConfig)
router.post('/hermes/test',  ctrl.testConnection)

// Hermes CLI profiles
router.get('/hermes-cli/providers',  ctrl.getHermesCLIProviders)
router.get('/hermes-cli',            ctrl.listHermesCLI)
router.post('/hermes-cli',           ctrl.createHermesCLI)
router.get('/hermes-cli/:name',      ctrl.getHermesCLI)
router.put('/hermes-cli/:name',      ctrl.updateHermesCLI)
router.delete('/hermes-cli/:name',   ctrl.deleteHermesCLI)

// App profiles CRUD
router.get('/',              ctrl.listProfiles)
router.post('/',             ctrl.createProfile)
router.get('/:id',           ctrl.getProfile)
router.put('/:id',           ctrl.updateProfile)
router.delete('/:id',        ctrl.deleteProfile)
router.post('/:id/default',  ctrl.setDefault)
router.post('/:id/duplicate', ctrl.duplicateProfile)

export default router
