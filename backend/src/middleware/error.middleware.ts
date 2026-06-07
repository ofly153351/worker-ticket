import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors?: unknown[]
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((e) => ({ field: e.path.map(String).join('.'), message: e.message })),
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Record not found', errors: [] })
      return
    }
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Duplicate value for unique field', errors: [] })
      return
    }
  }

  console.error('[Error]', err)
  res.status(500).json({ success: false, message: 'Internal server error', errors: [] })
}
