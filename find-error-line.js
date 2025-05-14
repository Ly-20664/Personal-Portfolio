// Script to specifically look for the mismatch around line 119
const fs = require('fs');

function findErrorLine(filePath) {
  try {
    console.log(`Analyzing ${filePath} for syntax issues...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Look for the specific error mentioned in the build log
    for (let i = 110; i < 120; i++) {
      if (i < lines.length) {
        console.log(`Line ${i + 1}: ${lines[i]}`);
      }
    }
    
    // Look for "ry to parse" typo specifically mentioned in the build error
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('ry to parse')) {
        console.log(`Found typo at line ${i + 1}: "${lines[i]}"`);
        break;
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

const filename = process.argv[2] || 'App.jsx';
findErrorLine(filename);
