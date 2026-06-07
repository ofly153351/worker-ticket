import { Client } from 'minio'
import { env } from '../config/env'

export const minio = new Client({
  endPoint:  env.MINIO_ENDPOINT,
  port:      env.MINIO_PORT,
  useSSL:    env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
})

export const BUCKET = env.MINIO_BUCKET

/** Public URL for a stored object */
export function publicUrl(objectName: string): string {
  return `${env.MINIO_PUBLIC_URL}/${BUCKET}/${objectName}`
}

/** Upload a Buffer or stream, returns the public URL */
export async function uploadFile(
  objectName: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await minio.putObject(BUCKET, objectName, buffer, buffer.length, { 'Content-Type': contentType })
  return publicUrl(objectName)
}

/** Delete an object by its full object name */
export async function deleteFile(objectName: string): Promise<void> {
  await minio.removeObject(BUCKET, objectName)
}

/** Extract object name from a full public URL */
export function objectNameFromUrl(url: string): string {
  const prefix = `${env.MINIO_PUBLIC_URL}/${BUCKET}/`
  return url.startsWith(prefix) ? url.slice(prefix.length) : url
}
