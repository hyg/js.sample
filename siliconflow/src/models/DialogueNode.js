export class DialogueNode {
  constructor({
    id,
    level = 0,
    systemPrompt,
    originalQuestion,
    parent = null,
    branchIndex = 0,
    variantTriple = null
  }) {
    this.id = id;
    this.level = level;
    this.systemPrompt = systemPrompt;
    this.originalQuestion = originalQuestion;
    this.parent = parent;
    this.branchIndex = branchIndex;
    this.variantTriple = variantTriple;

    this.steps = {};
    this.children = [];
    this.finalReport = null;
    this.timestamp = new Date();
  }

  addStep(stepName, data) {
    this.steps[stepName] = {
      data,
      timestamp: new Date()
    };
  }

  getStep(stepName) {
    return this.steps[stepName]?.data;
  }

  getAllSteps() {
    return Object.keys(this.steps);
  }

  getDepth() {
    return this.level;
  }

  getPath() {
    const path = [];
    let current = this;
    
    while (current) {
      path.unshift({
        id: current.id,
        question: current.originalQuestion,
        level: current.level,
        variantTriple: current.variantTriple
      });
      current = current.parent;
    }
    
    return path;
  }

  getDescendants() {
    const descendants = [];
    const queue = [...this.children];
    
    while (queue.length > 0) {
      const child = queue.shift();
      descendants.push(child);
      queue.push(...child.children);
    }
    
    return descendants;
  }

  toJSON() {
    return {
      id: this.id,
      level: this.level,
      systemPrompt: this.systemPrompt,
      originalQuestion: this.originalQuestion,
      parentId: this.parent?.id || null,
      branchIndex: this.branchIndex,
      variantTriple: this.variantTriple,
      steps: this.steps,
      finalReport: this.finalReport,
      timestamp: this.timestamp,
      childCount: this.children.length
    };
  }

  static fromJSON(data) {
    const node = new DialogueNode({
      id: data.id,
      level: data.level,
      systemPrompt: data.systemPrompt,
      originalQuestion: data.originalQuestion,
      branchIndex: data.branchIndex,
      variantTriple: data.variantTriple
    });

    node.steps = data.steps || {};
    node.finalReport = data.finalReport;
    node.timestamp = new Date(data.timestamp);
    
    return node;
  }
}