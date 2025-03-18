// This file helps diagnose Node.js version issues and adapt accordingly
const nodeVersion = process.versions.node.split('.').map(v => parseInt(v, 10));
const majorVersion = nodeVersion[0];

console.log(`Node.js version: ${process.version}`);

if (majorVersion >= 20) {
  console.log('Using newer Node.js compatibility mode...');
  
  // For newer Node.js versions, we need some special handling
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --no-warnings`;
  
  // Redirect to the actual server but with improved error handling
  import('./server.js').catch(err => {
    console.error('=========================================');
    console.error('Server initialization error:');
    console.error(err);
    console.error('=========================================');
    console.error('\nPossible solutions:');
    console.error('1. Try downgrading Node.js to v18 LTS');
    console.error('2. Check that all imported route files exist');
    console.error('3. Make sure all imports include the .js extension');
    console.error('4. Run: npm install ts-node@latest typescript@latest');
    process.exit(1);
  });
} else {
  // Older Node.js versions might work better with the original approach
  import('./server.js');
} 