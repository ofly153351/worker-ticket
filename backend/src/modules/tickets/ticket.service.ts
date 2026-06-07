import path from 'path'
import prisma from '../../lib/prisma'
import { AppError } from '../../middleware/error.middleware'
import { uploadFile, deleteFile, objectNameFromUrl } from '../../lib/minio'
import { CreateTicketDto, UpdateTicketDto, UpdateStatusDto, TicketFilters } from './ticket.schema'
import { Prisma, Severity, TicketStatus } from '@prisma/client'

export async function getTickets(filters: TicketFilters) {
  const { project_id, severity, status, search, date_from, date_to, page, limit } = filters
  const skip = (page - 1) * limit

  const where: Prisma.TicketWhereInput = {
    ...(project_id && { project_id }),
    ...(severity && { severity: severity as Severity }),
    ...(status && { status: status as TicketStatus }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { reporter_name: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(date_from || date_to ? {
      created_at: {
        ...(date_from && { gte: new Date(date_from) }),
        ...(date_to && { lte: new Date(date_to) }),
      },
    } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where, skip, take: limit,
      orderBy: { created_at: 'desc' },
      include: { images: true, project: { select: { id: true, name: true, code: true } } },
    }),
  ])

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getTicketById(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { images: true, project: { select: { id: true, name: true, code: true } } },
  })
  if (!ticket) throw new AppError('Ticket not found', 404)
  return ticket
}

export async function createTicket(data: CreateTicketDto, files: Express.Multer.File[]) {
  const uploadedKeys: string[] = []

  try {
    // Upload images to MinIO first (outside transaction — MinIO is not transactional)
    const imageData: { ticket_id: string; file_name: string; file_url: string; mime_type: string; size: number }[] = []

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({ data })

      if (files.length > 0) {
        for (const file of files) {
          const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
          const objectName = `tickets/${created.id}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
          const url = await uploadFile(objectName, file.buffer, file.mimetype)
          uploadedKeys.push(objectName)
          imageData.push({
            ticket_id: created.id,
            file_name: file.originalname,
            file_url:  url,
            mime_type: file.mimetype,
            size:      file.size,
          })
        }
        await tx.ticketImage.createMany({ data: imageData })
      }

      return tx.ticket.findUnique({ where: { id: created.id }, include: { images: true } })
    })

    return ticket
  } catch (err) {
    // Rollback MinIO uploads on DB failure
    await Promise.allSettled(uploadedKeys.map(k => deleteFile(k)))
    throw err
  }
}

export async function updateTicket(id: string, data: UpdateTicketDto) {
  await getTicketById(id)
  return prisma.ticket.update({ where: { id }, data, include: { images: true } })
}

export async function updateTicketStatus(id: string, dto: UpdateStatusDto) {
  await getTicketById(id)
  return prisma.ticket.update({
    where: { id },
    data: { status: dto.status as TicketStatus },
    include: { images: true },
  })
}

export async function deleteTicket(id: string) {
  const ticket = await getTicketById(id)

  // Delete images from MinIO
  await Promise.allSettled(
    ticket.images.map(img => deleteFile(objectNameFromUrl(img.file_url)))
  )

  await prisma.ticket.delete({ where: { id } })
}
