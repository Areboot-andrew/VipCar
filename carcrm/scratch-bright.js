const sharp = require('sharp');

async function getBrightColors(filePath) {
  try {
    const { data, info } = await sharp(filePath)
      .resize(100, 100, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });
      
    const colorCounts = {};
    for (let i = 0; i < data.length; i += info.channels) {
      const r = Math.round(data[i] / 5) * 5;
      const g = Math.round(data[i+1] / 5) * 5;
      const b = Math.round(data[i+2] / 5) * 5;
      
      // Filter out dark colors to find text colors
      if (r + g + b < 300) continue; 
      
      const key = `${r},${g},${b}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    }
    
    const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    console.log(`\nBright Colors for ${filePath}:`);
    sorted.forEach(([rgb, count]) => {
      const [r, g, b] = rgb.split(',');
      const hex = '#' + [r, g, b].map(x => Number(x).toString(16).padStart(2, '0')).join('');
      console.log(`- ${hex} (RGB: ${rgb}) - ${count} pixels`);
    });
  } catch (err) {
    console.error(err);
  }
}

async function main() {
  await getBrightColors('d:/Projects/CarCRMWEB/Банер1.png');
}

main();
