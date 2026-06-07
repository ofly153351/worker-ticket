import prisma from '../../lib/prisma'
import { AppError } from '../../middleware/error.middleware'

export async function getAllSummaries() {
  return prisma.dailyBugSummary.findMany({
    orderBy: { summary_date: 'desc' },
    include: { project: { select: { id: true, name: true, code: true } } },
  })
}

export async function getSummaryById(id: string) {
  const summary = await prisma.dailyBugSummary.findUnique({
    where: { id },
    include: { project: { select: { id: true, name: true, code: true } } },
  })
  if (!summary) throw new AppError('Summary not found', 404)
  return summary
}
