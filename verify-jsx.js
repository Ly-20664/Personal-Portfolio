const fs = require('fs');
const path = require('path');

// Path to the App.jsx file
const appJsxPath = path.join(__dirname, 'App.jsx');

// Read the file
try {
  const content = fs.readFileSync(appJsxPath, 'utf8');
  console.log('✅ Successfully read App.jsx');
  
  // Check for common syntax issues
  const braceCount = (content.match(/\{/g) || []).length;
  const closingBraceCount = (content.match(/\}/g) || []).length;
  
  console.log(`Opening braces: ${braceCount}`);
  console.log(`Closing braces: ${closingBraceCount}`);
  
  if (braceCount !== closingBraceCount) {
    console.error('❌ Brace mismatch in App.jsx! Check your syntax.');
    console.error(`Opening braces: ${braceCount}, Closing braces: ${closingBraceCount}`);
  } else {
    console.log('✅ Brace counts match. Basic syntax check passed.');
  }
  
  // Check for the specific error pattern mentioned in the build logs
  const useEffectPattern = /useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[\s*retryCount\s*\]\s*\)/;
  const hasCorrectUseEffect = useEffectPattern.test(content);
  
  if (hasCorrectUseEffect) {
    console.log('✅ useEffect with retryCount dependency appears correctly formatted.');
  } else {
    console.error('❌ useEffect with retryCount dependency may have formatting issues.');
  }
  
  // Check if there are any unexpected tokens in dependency arrays
  const dependencyArrayPattern = /\[\s*([^[\]]*?)\s*\]/g;
  const matches = [...content.matchAll(dependencyArrayPattern)];
  
  for (const match of matches) {
    const deps = match[1].trim();
    if (deps && !(/^[a-zA-Z0-9_$]+(?:\s*,\s*[a-zA-Z0-9_$]+)*$/.test(deps))) {
      console.error(`❌ Possibly malformed dependency array: [${deps}]`);
    }
  }
  
  console.log('✅ Syntax verification completed.');
  
} catch (error) {
  console.error('❌ Error reading or parsing App.jsx:', error);
}
