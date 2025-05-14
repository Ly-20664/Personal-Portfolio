// Simple utility to check for specific syntax errors
const fs = require('fs');

// Function to read a file and look for specific issues
async function analyzeFile(filePath) {
  try {
    console.log(`Analyzing ${filePath} for syntax issues...`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Track opening and closing braces
    let openBraces = 0;
    let closeBraces = 0;
    let currentLine = 1;
    
    // Line numbers where braces occur
    const bracePositions = [];
    
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') {
        openBraces++;
        bracePositions.push({ type: 'open', line: currentLine, position: i });
      } else if (content[i] === '}') {
        closeBraces++;
        bracePositions.push({ type: 'close', line: currentLine, position: i });
      } else if (content[i] === '\n') {
        currentLine++;
      }
    }
    
    console.log(`Found ${openBraces} opening braces and ${closeBraces} closing braces`);
    
    if (openBraces !== closeBraces) {
      console.log(`❌ BRACE MISMATCH: ${Math.abs(openBraces - closeBraces)} ${openBraces > closeBraces ? 'closing' : 'opening'} braces missing`);
      
      // Print the last 10 brace positions to help find the mismatch
      const lastPositions = bracePositions.slice(-20);
      console.log('Last 20 brace positions (to help locate the issue):');
      lastPositions.forEach(pos => {
        console.log(`${pos.type === 'open' ? 'Opening' : 'Closing'} brace at line ${pos.line}`);
      });
    } else {
      console.log('✅ Braces are balanced');
    }
    
    // Check for specific syntax issues
    if (content.includes('else if') && content.includes('else {')) {
      const elseIfIndex = content.indexOf('else if');
      const elseIndex = content.indexOf('else {');
      const lines = content.substring(0, Math.max(elseIfIndex, elseIndex)).split('\n');
      console.log(`Found else if/else around line ${lines.length}`);
    }
    
    // Check for common typos or missing semicolons
    if (content.includes('ry to parse')) {
      console.log('⚠️ Possible typo: "ry to parse" (should be "Try to parse")');
    }
    
    return { openBraces, closeBraces };
  } catch (error) {
    console.error(`Error analyzing file: ${error.message}`);
  }
}

// Take filename from command line arguments
const filename = process.argv[2] || 'App.jsx';
analyzeFile(filename);
