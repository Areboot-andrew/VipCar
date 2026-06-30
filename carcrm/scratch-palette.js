const sharp = require('sharp');

async function getPalette(filePath) {
  try {
    const { data, info } = await sharp(filePath)
      .resize(50, 50, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });
      
    const colorCounts = {};
    for (let i = 0; i < data.length; i += info.channels) {
      const r = Math.round(data[i] / 10) * 10;
      const g = Math.round(data[i+1] / 10) * 10;
      const b = Math.round(data[i+2] / 10) * 10;
      
      const key = `${r},${g},${b}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    }
    
    const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    console.log(`\nPalette for ${filePath}:`);
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
  await getPalette('d:/Projects/CarCRMWEB/Банер1.png');
}

main();
