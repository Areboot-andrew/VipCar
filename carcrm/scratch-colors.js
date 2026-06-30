const sharp = require('sharp');
const fs = require('fs');

async function extractColors(filePath) {
  try {
    const { dominant } = await sharp(filePath).stats();
    console.log(`\n=== Dominant Color for ${filePath} ===`);
    console.log(`RGB: ${dominant.r}, ${dominant.g}, ${dominant.b}`);
    console.log(`HEX: #${dominant.r.toString(16).padStart(2, '0')}${dominant.g.toString(16).padStart(2, '0')}${dominant.b.toString(16).padStart(2, '0')}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

async function main() {
  await extractColors('d:/Projects/CarCRMWEB/Банер1.png');
  await extractColors('d:/Projects/CarCRMWEB/Банер2.png');
  await extractColors('d:/Projects/CarCRMWEB/Банер3.png');
  await extractColors('d:/Projects/CarCRMWEB/Logo2.png');
}

main();
