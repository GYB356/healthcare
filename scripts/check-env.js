require('dotenv').config();

console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('Current working directory:', process.cwd());
console.log('Files in current directory:');
require('fs').readdirSync(process.cwd()).forEach(file => {
  console.log(file);
}); 