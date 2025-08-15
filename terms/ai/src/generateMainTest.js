const Clause = require('./Clause');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // Import js-yaml

// --- Utility function to save data as YAML ---
function saveAsYaml(fileName, data) {
    const outputPath = path.join(__dirname, '..', 'data', fileName);
    const yamlStr = yaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        quotingType: '"',
    });
    fs.writeFileSync(outputPath, yamlStr, 'utf8');
    console.log(`Saved YAML: ${outputPath}`);
}

// --- Utility function to write output to file ---
function writeOutput(fileName, content) {
    const outputPath = path.join(__dirname, '..', 'data', fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`Generated: ${outputPath}`);
}

// --- Create a global clause registry for main tests ---
global.globalClauseRegistry = {};

// Helper function to create a text clause (registration is automatic)
function createMainTextClause({ text, name, readme, mappings }) {
  // ID will be auto-generated based on text hash
  return new Clause({
    text,
    name,
    readme,
    localMapping: { ...mappings }
  });
}

// --- Test Data Generation (Main Tests) ---

// 1. Simple Text Clause with Anonymization (Chinese) and Revision Process
const simpleClause = createMainTextClause({
  text: "本协议由爱丽丝·史密斯（以下简称“甲方”）与鲍勃·琼斯之间签订。甲方同意于2023年10月26日前向鲍勃·琼斯支付10,000.00美元。",
  name: "付款条款",
  readme: "定义甲方的付款义务。",
  revisionProcessId: "revproc_abcdef12", // Example revision process ID
  mappings: {
    "{PARTY_A_NAME_1234567890}": "爱丽丝·史密斯",
    "{AMOUNT_VARIABLE_0987654321}": "10,000.00美元",
    "{DATE_FUZZY_1122334455}": "2023年10月26日"
  }
});
// Save YAML for simple clause data
saveAsYaml('simple_clause_data.yaml', {
  id: simpleClause.id,
  text: simpleClause.text,
  name: simpleClause.name,
  readme: simpleClause.readme,
  mappings: simpleClause.localMapping
});

// 2. Composite Clause (Chinese) with at least three sub-clauses
const subClauseA = createMainTextClause({
  text: "承包商查理·布朗将于2024年1月15日开始工作。",
  name: "开工日期",
  readme: "指定承包商的开工时间。",
  mappings: {
    "{CONTRACTOR_NAME_abcdef1234}": "查理·布朗",
    "{START_DATE_5566778899}": "2024年1月15日"
  }
});
saveAsYaml('sub_clause_A_data.yaml', {
  id: subClauseA.id,
  text: subClauseA.text,
  name: subClauseA.name,
  readme: subClauseA.readme,
  mappings: subClauseA.localMapping
});

const subClauseB = createMainTextClause({
  text: "项目工期为180天。所有交付物需在开工日期后180天内完成。",
  name: "项目工期",
  readme: "定义项目时长和交付条款。",
  mappings: {
    "{DURATION_DAYS_fedcba4321}": "180"
  }
});
saveAsYaml('sub_clause_B_data.yaml', {
  id: subClauseB.id,
  text: subClauseB.text,
  name: subClauseB.name,
  readme: subClauseB.readme,
  mappings: subClauseB.localMapping
});

const subClauseC = createMainTextClause({
  text: "项目里程碑一：设计阶段应于开工后60天内完成。",
  name: "设计阶段里程碑",
  readme: "设定设计阶段的完成时间点。",
  mappings: {
    "{MILESTONE_DAYS_1111111111}": "60"
  }
});
saveAsYaml('sub_clause_C_data.yaml', {
  id: subClauseC.id,
  text: subClauseC.text,
  name: subClauseC.name,
  readme: subClauseC.readme,
  mappings: subClauseC.localMapping
});

// Create the composite clause using the new structure with three sub-clauses
// Each sub-clause definition includes id, index (can be complex), and optional mapping/numberPrefix
const compositeClause = new Clause({
  name: "项目进度计划",
  readme: "概述关键日期和里程碑。",
  localMapping: {},
  subClauses: [
    {
      id: subClauseA.id,
      index: 1, // Numeric index
      numberPrefix: "Ⅰ." // Roman numeral prefix
    },
    {
      id: subClauseB.id,
      index: 2, // Numeric index
      numberPrefix: "Ⅱ." // Roman numeral prefix
    },
    {
      id: subClauseC.id,
      index: 3, // Numeric index
      numberPrefix: "Ⅲ." // Roman numeral prefix
    }
  ]
});
// Save YAML for composite clause data
saveAsYaml('composite_clause_data.yaml', {
  id: compositeClause.id,
  name: compositeClause.name,
  readme: compositeClause.readme,
  mappings: compositeClause.localMapping,
  subClauses: compositeClause.subClauses // Save the sub-clause definitions
});

// --- Output Generation (Main Tests) ---

// Generate and write outputs for Simple Clause
console.log("--- Generating Simple Clause ---");
writeOutput(`simple_clause_${simpleClause.id}.md`, simpleClause.toMarkdown());
writeOutput(`simple_clause_${simpleClause.id}.html`, simpleClause.toHtml());

// Generate and write outputs for Composite Clause
console.log("\n--- Generating Composite Clause ---");
writeOutput(`composite_clause_${compositeClause.id}.md`, compositeClause.toMarkdown());
writeOutput(`composite_clause_${compositeClause.id}.html`, compositeClause.toHtml());

console.log("\n--- Main test files generated successfully. ---\n");