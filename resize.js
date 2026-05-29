const Jimp = require('jimp');

async function generateFavicons() {
  try {
    console.log('Loading logo.png...');
    const image = await Jimp.read('./public/logo.png');

    console.log('Autocropping transparent padding...');
    image.autocrop();

    console.log('Generating 16x16...');
    const img16 = image.clone().contain(16, 16, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
    await img16.writeAsync('./public/favicon-16x16.png');

    console.log('Generating 32x32...');
    const img32 = image.clone().contain(32, 32, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
    await img32.writeAsync('./public/favicon-32x32.png');

    console.log('Generating apple-touch-icon...');
    const img180 = image.clone().contain(180, 180, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
    await img180.writeAsync('./public/apple-touch-icon.png');
    
    console.log('Generating favicon.ico...');
    // A PNG renamed to .ico works in all modern browsers, and Next.js accepts it.
    await img32.writeAsync('./public/favicon.ico');

    console.log('Favicons generated successfully.');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons();
