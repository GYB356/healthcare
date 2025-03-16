import prisma from '../lib/prisma'

export async function getAllUsers() {
  return prisma.user.findMany()
}

export async function createUser(userData) {
  return prisma.user.create({
    data: userData
  })
}

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id }
  })
}
