require('dotenv').config();

console.log('Current working directory:', process.cwd());
console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('All env variables:', process.env); 