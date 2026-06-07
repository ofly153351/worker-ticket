import dotenv from 'dotenv'
dotenv.config()

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
