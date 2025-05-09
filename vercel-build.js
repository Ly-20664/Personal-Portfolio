// File: vercel-build.js
const fs = require('fs-extra');
const path = require('path');

// This script ensures that static assets are copied correctly in Vercel's environment

async function copyStaticAssets() {
  try {
    console.log('Copying static assets for Vercel deployment...');
      // Make sure dist directory exists
    await fs.ensureDir(path.join(__dirname, 'dist'));
    
    // Copy critical static files
    const staticFiles = ['styles.css', 'script.js', 'index.html'];
    for (const file of staticFiles) {
      if (fs.existsSync(path.join(__dirname, file))) {
        await fs.copyFile(
          path.join(__dirname, file),
          path.join(__dirname, 'dist', file)
        );
        console.log(`Copied ${file} to dist`);
      }
    }
    
    // Copy images directory if it exists
    if (fs.existsSync(path.join(__dirname, 'images'))) {
      await fs.copy(
        path.join(__dirname, 'images'),
        path.join(__dirname, 'dist', 'images'),
        { overwrite: true }
      );
      console.log('Copied images directory to dist');
    }
    
    // Copy any PDF files
    const pdfFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.pdf'));
    
    for (const pdf of pdfFiles) {
      await fs.copyFile(
        path.join(__dirname, pdf),
        path.join(__dirname, 'dist', pdf)
      );
      console.log(`Copied ${pdf} to dist`);
    }
    
    console.log('Static asset copying complete!');
  } catch (error) {
    console.error('Error copying static assets:', error);
    process.exit(1);
  }
}

// Run the function
copyStaticAssets();
