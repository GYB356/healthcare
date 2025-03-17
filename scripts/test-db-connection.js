const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing database connection...')
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('test123', 10)
    
    // Try to create a test user
    const user = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN'
      }
    })
    
    console.log('Successfully created admin user:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    })
    
    // Verify we can query the user
    const users = await prisma.user.findMany()
    console.log('\nAll users in database:', users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role
    })))
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('Error: User with this email already exists')
    } else {
      console.error('Error:', error.message)
      console.error('Error code:', error.code)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main() 