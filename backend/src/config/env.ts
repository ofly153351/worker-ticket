import dotenv from 'dotenv'
import path from 'path'

// Load env-specific file first (.env.development / .env.production), then .env as
// a fallback. dotenv does NOT override already-set vars, so the specific file wins.
const NODE_ENV = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(process.cwd(), `.env.${NODE_ENV}`) })
dotenv.config() // fallback: plain .env fills anything still unset

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  HERMES_AGENT_ENABLED: process.env.HERMES_AGENT_ENABLED === 'true',
  HERMES_AGENT_ENDPOINT: process.env.HERMES_AGENT_ENDPOINT || 'http://localhost:8787',
  MINIO_ENDPOINT:   process.env.MINIO_ENDPOINT   || 'localhost',
  MINIO_PORT:       parseInt(process.env.MINIO_PORT || '9000', 10),
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY  || 'minioadmin',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY  || 'change-me',
  MINIO_BUCKET:     process.env.MINIO_BUCKET      || 'obx-ticket',
  MINIO_USE_SSL:    process.env.MINIO_USE_SSL === 'true',
  MINIO_PUBLIC_URL: process.env.MINIO_PUBLIC_URL  || 'http://localhost:9000',
}
