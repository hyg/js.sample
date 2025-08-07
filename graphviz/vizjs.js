// svg.js
const { instance } = require('@viz-js/viz');
const fs = require('fs');
const sharp = require('sharp');

(async () => {
  const viz = await instance();
  const dot = `digraph G { Hello[color=blue,style=filled]; World; Hello->World[color=red]; }`;
  const svg = viz.renderString(dot, { format: 'svg' });
  fs.writeFileSync('out.svg', svg);
  
  await sharp('out.svg', { density: 200 })   // 200 dpi
        .png()
        .toFile('out.png');
  console.log('✅ out.png 已生成');
})();
