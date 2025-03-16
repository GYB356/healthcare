import { PrismaClient } from '@prisma/client'

// Create a singleton instance
const prisma = new PrismaClient()

export default prisma
