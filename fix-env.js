import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check current environment files
function checkEnvFiles() {
  console.log('Checking environment files...');
  
  const envPath = path.join(__dirname, '.env');
  const secretsPath = path.join(__dirname, '.env.secrets');
  
  const envExists = fs.existsSync(envPath);
  const secretsExists = fs.existsSync(secretsPath);
  
  console.log(`.env file ${envExists ? 'exists' : 'does not exist'}`);
  console.log(`.env.secrets file ${secretsExists ? 'exists' : 'does not exist'}`);
  
  return { envExists, secretsExists };
}

// Fix environment file format
function fixEnvFile(filePath) {
  console.log(`Fixing format in ${path.basename(filePath)}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} does not exist`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  let modified = false;
  
  const fixedLines = lines.map(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      return line;
    }
    
    // Try to parse the line as KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) return line;
    
    const [, key, value] = match;
    
    // Check if the value is wrapped in quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      // Remove quotes
      const unquoted = value.substring(1, value.length - 1);
      console.log(`Fixed: ${key}=*** (removed quotes)`);
      modified = true;
      return `${key}=${unquoted}`;
    }
    
    return line;
  });
  
  if (modified) {
    // Create backup
    fs.writeFileSync(`${filePath}.bak`, content);
    console.log(`Created backup at ${path.basename(filePath)}.bak`);
    
    // Write fixed content
    fs.writeFileSync(filePath, fixedLines.join('\n'));
    console.log(`Updated ${path.basename(filePath)} with fixed format`);
    return true;
  } else {
    console.log(`No quote issues found in ${path.basename(filePath)}`);
    return false;
  }
}

// Check environment variables
async function checkEnvVariables() {
  console.log('\nChecking essential database environment variables:');
  
  // dotenv needs to be imported dynamically since we're using ES modules
  try {
    const dotenvModule = await import('dotenv');
    dotenvModule.config();
    
    // Try to load .env.secrets if it exists
    const secretsPath = path.join(__dirname, '.env.secrets');
    if (fs.existsSync(secretsPath)) {
      dotenvModule.config({ path: secretsPath });
    }
  } catch (err) {
    console.error('Error loading dotenv:', err.message);
  }
  
  // Check for DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('✓ DATABASE_URL is set');
    
    try {
      new URL(process.env.DATABASE_URL);
      console.log('✓ DATABASE_URL has valid URL format');
    } catch (e) {
      console.log('✗ DATABASE_URL is not a valid URL');
    }
  } else {
    console.log('✗ DATABASE_URL is not set');
    
    // Check individual connection parameters
    const params = ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];
    let allPresent = true;
    
    params.forEach(param => {
      if (process.env[param]) {
        console.log(`✓ ${param} is set`);
      } else {
        console.log(`✗ ${param} is not set`);
        allPresent = false;
      }
    });
    
    if (!allPresent) {
      console.log('\nMissing database connection parameters');
    }
  }
}

// Create example .env.secrets if needed
function createExampleSecrets() {
  const secretsPath = path.join(__dirname, '.env.secrets');
  
  if (!fs.existsSync(secretsPath)) {
    console.log('\nCreating example .env.secrets file...');
    
    const exampleContent = `# Database credentials - DO NOT commit this file to version control
# Remove any quotes around values

# Either use connection string
DATABASE_URL=postgres://username:password@localhost:5432/dbname

# Or use individual parameters
PGHOST=localhost
PGPORT=5432
PGDATABASE=your_database_name
PGUSER=your_database_user
PGPASSWORD=your_database_password

# Other secrets
JWT_SECRET=your_jwt_secret_key
`;
    
    fs.writeFileSync(`${secretsPath}.example`, exampleContent);
    console.log(`Created ${path.basename(secretsPath)}.example`);
  }
}

// Main function
async function main() {
  console.log('=== Database Environment Configuration Helper ===\n');
  
  const { envExists, secretsExists } = checkEnvFiles();
  
  if (envExists) {
    fixEnvFile(path.join(__dirname, '.env'));
  }
  
  if (secretsExists) {
    fixEnvFile(path.join(__dirname, '.env.secrets'));
  }
  
  await checkEnvVariables();
  createExampleSecrets();
  
  console.log('\n=== Suggestions ===');
  console.log('1. Make sure your database is running and accessible');
  console.log('2. Ensure passwords don\'t have quotes around them in .env files');
  console.log('3. Try setting individual connection parameters instead of DATABASE_URL');
  console.log('4. After fixing your .env files, run: node db-helper.js to test the connection');
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 