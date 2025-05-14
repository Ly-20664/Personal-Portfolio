const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Read the App.jsx file
  const appJsxContent = fs.readFileSync('App.jsx', 'utf-8');
  console.log('Successfully read App.jsx');
  
  // Create a temporary file to test compilation
  fs.writeFileSync('App.jsx.test', appJsxContent);
  
  try {
    // Try to compile the file using Babel
    console.log('Testing compilation with Babel...');
    execSync('npx babel App.jsx.test --presets=@babel/preset-react --out-file App.jsx.compiled');
    console.log('✅ App.jsx compiled successfully! No syntax errors found.');
  } catch (compileError) {
    console.error('❌ Syntax errors found:');
    console.error(compileError.toString());
  } finally {
    // Clean up temporary files
    try {
      fs.unlinkSync('App.jsx.test');
      fs.unlinkSync('App.jsx.compiled');
    } catch (e) {
      // Ignore
    }
  }
} catch (error) {
  console.error('Error reading App.jsx:', error);
}
