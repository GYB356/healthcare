const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'roofing_tracker',
  password: 'postgres',
  port: 5432,
})

async function testConnection() {
  try {
    console.log('Attempting to connect...')
    await client.connect()
    console.log('Connected successfully!')
    
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'create-tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('Creating tables...')
    await client.query(sql)
    console.log('Tables created successfully!')
    
    // Verify the table was created
    const res = await client.query('SELECT * FROM "User" LIMIT 1')
    console.log('User table exists with structure:', res.fields.map(f => f.name))
    
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await client.end()
  }
}

testConnection() 