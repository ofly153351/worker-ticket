import prisma from '../../lib/prisma'
import { AppError } from '../../middleware/error.middleware'
import { CreateProjectDto, UpdateProjectDto } from './project.schema'

export async function getAllProjects() {
  return prisma.project.findMany({ orderBy: { created_at: 'desc' } })
}

export async function getProjectById(id: string) {
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) throw new AppError('Project not found', 404)
  return project
}

export async function createProject(data: CreateProjectDto) {
  return prisma.project.create({ data })
}

export async function updateProject(id: string, data: UpdateProjectDto) {
  await getProjectById(id)
  return prisma.project.update({ where: { id }, data })
}

export async function deleteProject(id: string) {
  await getProjectById(id)
  await prisma.project.delete({ where: { id } })
}
