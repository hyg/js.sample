// hpcc-svg.js
const { Graphviz } = require('@hpcc-js/wasm-graphviz');
const fs = require('fs');
const sharp = require('sharp');

(async () => {
  const graphviz = await Graphviz.load();
  const dot = `
    digraph G {
      Hello [color=blue, style=filled];
      World;
      Hello -> World [color=red];
    }
  `;
  const svg = graphviz.layout(dot, 'svg', 'dot'); // 只改这里
  fs.writeFileSync('out.svg', svg);
  console.log('✅ out.svg 已生成');

  sharp('out.svg', { density: 200 })   // 200 dpi
  .png()
  .toFile('out.png')
  .then(() => console.log('✅ out.png 已生成'));
})();