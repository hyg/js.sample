export class MermaidGenerator {
  constructor() {
    this.nodeColors = [
      '#FFF5E1', '#FFE2B7', '#FFD4A3', '#FFC09F',
      '#D4F1F4', '#75E6DA', '#189AB4', '#05445E'
    ];
  }

  generateMermaid(node) {
    if (!node) return '';

    const lines = [
      '\n\n### 当前分支关系图\n\n```mermaid',
      'graph TD',
      '    %%{init:{"flowchart":{"nodeSpacing":50,"rankSpacing":80}} }%%',
      ''
    ];

    this.generateNodeStructure(node, lines, new Set());
    
    lines.push('```\n');
    return lines.join('\n');
  }

  generateFullMermaid(rootNode) {
    if (!rootNode) return '';

    const lines = [
      '\n\n### 完整对话关系图\n\n```mermaid',
      'graph TD',
      '    %%{init:{"flowchart":{"nodeSpacing":50,"rankSpacing":80}} }%%',
      ''
    ];

    this.generateNodeStructure(rootNode, lines, new Set());
    
    lines.push('```\n');
    return lines.join('\n');
  }

  generateNodeStructure(node, lines, visited) {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    const nodeColor = this.getNodeColor(node.level);
    const nodeLabel = this.generateNodeLabel(node);
    
    lines.push(`    ${node.id}["${nodeLabel}"]:::level${node.level}`);

    // 添加节点样式
    if (!lines.find(line => line.includes(`classDef level${node.level}`))) {
      const style = `    classDef level${node.level}
        fill:${nodeColor},stroke:#333,stroke-width:${Math.max(1, 3 - node.level / 3)}px
        style ${node.id} classDef`;
      lines.push(style);
    }

    // 递归生成子节点
    node.children.forEach((child, index) => {
      const edgeLabel = child.variantTriple ? 
        `\n变体关系的\n"${child.variantTriple.relation}"` : `\n分支${index + 1}`;
      
      lines.push(`    ${node.id} -- "${edgeLabel}" --> ${child.id}`);
      this.generateNodeStructure(child, lines, visited);
    });
  }

  generateNodeLabel(node) {
    const padding = '  '.repeat(node.level);
    const impact = node.variantTriple ? `[影响${this.calculateImpact(node)}]` : '';
    
    let label = `${padding}\`${node.level}-${node.branchIndex}\`\n`;
    label += `\n${node.originalQuestion.substring(0, 60)}${node.originalQuestion.length > 60 ? '...' : ''}`;
    
    if (impact) {
      label += `\n${impact}`;
    }

    return label;
  }

  getNodeColor(level) {
    return this.nodeColors[level % this.nodeColors.length];
  }

  calculateImpact(node) {
    return Math.max(1, 5 - node.level);
  }

  visualizeCurrentBranch(node) {
    const branchNodes = this.getBranchNodes(node);
    if (branchNodes.length === 0) return '';

    const lines = [
      '\n\n### 当前分支脉络图\n\n```mermaid',
      'graph LR',
      '    %%{init:{"flowchart":{"nodeSpacing":40,"rankSpacing":60}} }%%',
      ''
    ];

    branchNodes.forEach((currentNode, index) => {
      const label = `\`${currentNode.id}\`\n\n${currentNode.originalQuestion.substring(0, 40)}...`;
      lines.push(`    ${currentNode.id}["${label}"]:::branch${index}`);
    });

    for (let i = 0; i < branchNodes.length - 1; i++) {
      lines.push(`    ${branchNodes[i].id} --> ${branchNodes[i + 1].id}`);
    }

    branchNodes.forEach((_, index) => {
      lines.push(`    classDef branch${index} fill:${this.getNodeColor(index)},stroke:#333,stroke-width:2px`);
    });

    lines.push('```\n');
    return lines.join('\n');
  }

  getBranchNodes(node) {
    const path = [];
    let current = node;
    
    while (current) {
      path.unshift(current);
      current = current.parent;
    }
    
    return path;
  }
}