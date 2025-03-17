const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  try {
    console.log('Attempting to connect to database...')
    console.log('Connection URL:', process.env.DATABASE_URL)
    
    await prisma.$connect()
    console.log('Successfully connected to the database')
    
    // Try to create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'test123',
        name: 'Test User',
        role: 'USER'
      }
    })
    console.log('Successfully created test user:', testUser)
    
  } catch (error) {
    console.error('Database Error:', error)
    console.error('Error name:', error.name)
    console.error('Error code:', error.code)
    if (error.meta) {
      console.error('Error meta:', error.meta)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main() 