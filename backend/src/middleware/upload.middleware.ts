import multer, { FileFilterCallback } from 'multer'
import { Request } from 'express'

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}. Allowed: png, jpg, jpeg, webp`))
  }
}

// Use memory storage — files streamed directly to MinIO, no temp disk writes
export const uploadImages = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).array('images', 10)
