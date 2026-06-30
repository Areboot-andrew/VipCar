const sharp = require('sharp');
const path = require('path');

async function processLogo() {
  const input = path.resolve('d:/Projects/CarCRMWEB/Logo2.png');
  const output = path.resolve('d:/Projects/CarCRMWEB/carcrm/public/logo.png');
  
  try {
    await sharp(input)
      .trim() // Removes background color from edges
      .resize({ height: 100 }) // Normalize height
      .toFile(output);
      
    console.log(`Logo processed successfully and saved to ${output}`);
  } catch (err) {
    console.error('Error processing logo:', err);
  }
}

processLogo();
