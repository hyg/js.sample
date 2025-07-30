class QuestionTree {
    constructor() {
        this.root = null;
        this.currentId = 1;
    }

    createRoot(question, systemPrompt) {
        this.root = {
            id: 'root-001',
            question,
            systemPrompt,
            children: [],
            level: 0,
            parent: null,
            metadata: {
                entities: [],
                relations: [],
                stabilityAnalysis: [],
                createdAt: new Date().toISOString()
            }
        };
        return this.root;
    }

    addChild(parentNode, newQuestion, systemPrompt, metadata = {}) {
        const childId = this.generateId(parentNode.level + 1);
        const child = {
            id: childId,
            question: newQuestion,
            systemPrompt,
            children: [],
            level: parentNode.level + 1,
            parent: parentNode,
            metadata: {
                ...metadata,
                createdAt: new Date().toISOString()
            }
        };
        
        parentNode.children.push(child);
        return child;
    }

    generateId(level) {
        const prefix = 'level' + level;
        const suffix = String(this.currentId++).padStart(3, '0');
        return `${prefix}-${suffix}`;
    }

    generateMermaid() {
        let mermaid = 'graph TD\n';
        
        function addNode(node) {
            const label = `${node.id}["${node.question.substring(0, 30)}..."]`;
            mermaid += `    ${label}\n`;
            
            node.children.forEach(child => {
                const childLabel = `${child.id}["${child.question.substring(0, 30)}..."]`;
                mermaid += `    ${node.id} --> ${child.id}\n`;
                addNode(child);
            });
        }
        
        if (this.root) {
            addNode(this.root);
        }
        
        mermaid += '\n    classDef rootNode fill:#ff9999,stroke:#ff6666\n';
        mermaid += '    classDef level1Node fill:#99ccff,stroke:#6699ff\n';
        mermaid += '    classDef level2Node fill:#99ff99,stroke:#66cc66\n';
        mermaid += '    classDef level3Node fill:#ffff99,stroke:#cccc00\n';
        mermaid += '    classDef level4Node fill:#ff99ff,stroke:#cc00cc\n';
        
        return mermaid;
    }

    printTree() {
        console.log('\n🌳 问题树结构:'.cyan);
        console.log(this.generateMermaid());
    }

    printCurrentTree() {
        console.log('\n🌳 当前问题树:'.cyan);
        this._printNode(this.root, 0);
    }

    _printNode(node, depth) {
        if (!node) return;

        const indent = '  '.repeat(depth);
        console.log(`${indent}- ${node.id}: ${node.question}`);

        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                this._printNode(child, depth + 1);
            });
        }
    }

    getPath(node) {
        const path = [];
        let current = node;
        while (current) {
            path.unshift(current);
            current = current.parent;
        }
        return path;
    }

    findNodeById(id) {
        return this._findNode(this.root, id);
    }

    _findNode(node, id) {
        if (!node) return null;
        if (node.id === id) return node;
        
        for (const child of node.children) {
            const found = this._findNode(child, id);
            if (found) return found;
        }
        
        return null;
    }

    // 安全序列化方法，避免循环引用
    toJSON() {
        const copyTree = (node) => {
            if (!node) return null;
            
            // 创建不包含循环引用的新节点
            const copy = {
                id: node.id,
                question: node.question,
                systemPrompt: node.systemPrompt,
                level: node.level,
                metadata: node.metadata,
                children: []
            };
            
            // 递归复制子节点
            if (node.children && node.children.length > 0) {
                copy.children = node.children.map(child => copyTree(child)).filter(child => child !== null);
            }
            
            return copy;
        };
        
        return copyTree(this.root);
    }
}

module.exports = QuestionTree;