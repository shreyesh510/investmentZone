const fs = require('fs');
const path = require('path');

console.log('Testing file reading...');

const usersPath = path.join(__dirname, 'src/database/users.json');
console.log('Users path:', usersPath);

try {
  const data = fs.readFileSync(usersPath, 'utf8');
  console.log('File content:', data);
  const users = JSON.parse(data);
  console.log('Parsed users:', users);
  
  // Test finding user
  const testUser = users.find(user => user.email === 'vivekkolhe@gmail.com');
  console.log('Test user found:', testUser);
  
  if (testUser) {
    console.log('Password check:', 'Vivek@123' === testUser.password);
  }
} catch (error) {
  console.error('Error:', error);
}
