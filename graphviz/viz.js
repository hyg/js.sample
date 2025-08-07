// viz.js
const { instance } = require('@viz-js/viz');
const fs = require('fs');

(async () => {
  const viz = await instance();

  const dot = `
    digraph G {
      Hello [color=blue, style=filled];
      World;
      Hello -> World [color=red];
    }
  `;

  // 1. 生成 SVG 字符串
  const svg = viz.renderString(dot, { format: 'svg' });
  fs.writeFileSync('out.svg', svg);
})();
