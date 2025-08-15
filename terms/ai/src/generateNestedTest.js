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

// --- Use the global clause registry (defined in generateMainTest.js or index.js) ---
// global.globalClauseRegistry is expected to be available

// Helper function to create a text clause (registration is automatic)
function createNestedTextClause({ text, name, readme, mappings }) {
  // ID will be auto-generated based on text hash
  return new Clause({
    text,
    name,
    readme,
    localMapping: { ...mappings }
  });
}

// --- Four-Level Nested Clause Test (All in Chinese) ---

// --- Level 4 (Leaf Clauses) ---
const leafClause1 = createNestedTextClause({
  text: "检查员格雷迪必须在子系统交付后30天内完成检查。",
  name: "检查责任",
  readme: "定义谁执行检查及时间范围。",
  mappings: {
    "{INSPECTOR_NAME_1a2b3c4d5e}": "格雷迪检查员",
    "{INSPECTION_DAYS_0e9d8c7b6a}": "30"
  }
});

const leafClause2 = createNestedTextClause({
  text: "供应商贝塔提供的零件保修期为安装之日起2年。",
  name: "供应商贝塔保修条款",
  readme: "专门针对供应商贝塔的保修条件。",
  mappings: {
    "{SUPPLIER_BETA_NAME_f0e9d8c7b6}": "贝塔供应商",
    "{SUPPLIER_BETA_WARRANTY_YEARS_a1b2c3d4e5}": "2"
  }
});

const leafClause3 = createNestedTextClause({
  text: "项目经理应在项目启动后15个工作日内提交详细项目计划。",
  name: "项目计划提交",
  readme: "规定项目经理提交计划的时间要求。",
  mappings: {
    "{PROJECT_MANAGER_NAME_9f8e7d6c5b}": "项目经理",
    "{PLAN_SUBMISSION_DAYS_5544332211}": "15"
  }
});

// Save YAML for leaf clauses data
saveAsYaml('leaf_clause_1_data.yaml', {
  id: leafClause1.id,
  text: leafClause1.text,
  name: leafClause1.name,
  readme: leafClause1.readme,
  mappings: leafClause1.localMapping
});
saveAsYaml('leaf_clause_2_data.yaml', {
  id: leafClause2.id,
  text: leafClause2.text,
  name: leafClause2.name,
  readme: leafClause2.readme,
  mappings: leafClause2.localMapping
});
saveAsYaml('leaf_clause_3_data.yaml', {
  id: leafClause3.id,
  text: leafClause3.text,
  name: leafClause3.name,
  readme: leafClause3.readme,
  mappings: leafClause3.localMapping
});

// --- Level 3 ---
// Create Level 3 clauses using the new sub-clause structure, each with at least 3 sub-clauses
const level3Clause1 = new Clause({
  name: "A小节合规性",
  readme: "A小节的合规性细节。",
  localMapping: {},
  subClauses: [
    {
      id: leafClause1.id,
      index: "3.a.1", // Complex index
      numberPrefix: "⑴" // Circled number prefix
    },
    {
      id: leafClause2.id,
      index: "3.a.2", // Complex index
      numberPrefix: "⑵" // Circled number prefix
    },
    {
        id: leafClause3.id,
        index: "3.a.3", // Complex index
        numberPrefix: "⑶" // Circled number prefix
    }
  ]
});

const level3Clause2 = new Clause({
  name: "B小节合规性",
  readme: "B小节的合规性细节，包括供应商条款。",
  localMapping: {
    "{SECTION_B_MANAGER_5f4e3d2c1b}": "西塔经理"
  },
  subClauses: [
    {
      id: leafClause1.id,
      index: "3.b.1", // Complex index
      numberPrefix: "⒈" // Parenthesized number prefix
    },
    {
      id: leafClause2.id,
      index: "3.b.2", // Complex index
      numberPrefix: "⒉" // Parenthesized number prefix
    },
    {
        id: leafClause3.id,
        index: "3.b.3", // Complex index
        numberPrefix: "⒊" // Parenthesized number prefix
    }
  ]
});

const level3Clause3 = new Clause({
    name: "C小节合规性",
    readme: "C小节的合规性细节。",
    localMapping: {
        "{SECTION_C_SUPERVISOR_1a2b3c4d5e}": "伊普西龙监理"
    },
    subClauses: [
        {
            id: leafClause1.id,
            index: "3.c.1", // Complex index
            numberPrefix: "a." // Lowercase letter prefix
        },
        {
            id: leafClause2.id,
            index: "3.c.2", // Complex index
            numberPrefix: "b." // Lowercase letter prefix
        },
        {
            id: leafClause3.id,
            index: "3.c.3", // Complex index
            numberPrefix: "c." // Lowercase letter prefix
        }
    ]
});

saveAsYaml('level_3_clause_1_data.yaml', {
  id: level3Clause1.id,
  name: level3Clause1.name,
  readme: level3Clause1.readme,
  mappings: level3Clause1.localMapping,
  subClauses: level3Clause1.subClauses
});
saveAsYaml('level_3_clause_2_data.yaml', {
  id: level3Clause2.id,
  name: level3Clause2.name,
  readme: level3Clause2.readme,
  mappings: level3Clause2.localMapping,
  subClauses: level3Clause2.subClauses
});
saveAsYaml('level_3_clause_3_data.yaml', {
    id: level3Clause3.id,
    name: level3Clause3.name,
    readme: level3Clause3.readme,
    mappings: level3Clause3.localMapping,
    subClauses: level3Clause3.subClauses
});

// --- Level 2 ---
// Create Level 2 clause with at least 3 sub-clauses (the Level 3 clauses)
const level2Clause = new Clause({
  name: "主节合规性详情",
  readme: "主节的详细合规性结构。",
  localMapping: {
    "{SECTION_COMPLIANCE_OFFICER_9a8b7c6d5e}": "泽塔合规官",
  },
  subClauses: [
    {
      id: level3Clause1.id,
      index: "2.1", // Complex index
      numberPrefix: "一、" // Chinese numeral prefix
    },
    {
      id: level3Clause2.id,
      index: "2.2", // Complex index
      numberPrefix: "二、" // Chinese numeral prefix
    },
    {
        id: level3Clause3.id,
        index: "2.3", // Complex index
        numberPrefix: "三、" // Chinese numeral prefix
    }
  ]
});

saveAsYaml('level_2_clause_data.yaml', {
  id: level2Clause.id,
  name: level2Clause.name,
  readme: level2Clause.readme,
  mappings: level2Clause.localMapping,
  subClauses: level2Clause.subClauses
});

// --- Level 1 (Root Clause) ---
// Create additional clauses to include at the root level, ensuring at least 3 sub-clauses
const simpleClause = createNestedTextClause({
  text: "本协议由爱丽丝·史密斯（以下简称“甲方”）与鲍勃·琼斯之间签订。甲方同意于2023年10月26日前向鲍勃·琼斯支付10,000.00美元。",
  name: "付款条款",
  readme: "定义甲方的付款义务。",
  mappings: {
    "{PARTY_A_NAME_1234567890}": "爱丽丝·史密斯",
    "{AMOUNT_VARIABLE_0987654321}": "10,000.00美元",
    "{DATE_FUZZY_1122334455}": "2023年10月26日"
  }
});

const subClauseX = createNestedTextClause({
  text: "承包商查理·布朗将于2024年1月15日开始工作。",
  name: "开工日期",
  readme: "指定承包商的开工时间。",
  mappings: {
    "{CONTRACTOR_NAME_abcdef1234}": "查理·布朗",
    "{START_DATE_5566778899}": "2024年1月15日"
  }
});

const subClauseY = createNestedTextClause({
  text: "项目工期为180天。所有交付物需在开工日期后180天内完成。",
  name: "项目工期",
  readme: "定义项目时长和交付条款。",
  mappings: {
    "{DURATION_DAYS_fedcba4321}": "180"
  }
});

const subClauseZ = createNestedTextClause({
    text: "项目总预算为500,000.00美元，分三期支付。",
    name: "项目预算与支付",
    readme: "定义项目总体预算和分期支付计划。",
    mappings: {
        "{TOTAL_BUDGET_1234567890}": "500,000.00美元",
        "{PAYMENT_INSTALLMENTS_0987654321}": "三"
    }
});

const compositeClause = new Clause({
  name: "项目进度与预算",
  readme: "概述关键日期、里程碑和预算。",
  localMapping: {},
  subClauses: [
    {
      id: subClauseX.id,
      index: "3.1", // Complex index
      numberPrefix: "A." // Uppercase letter prefix
    },
    {
      id: subClauseY.id,
      index: "3.2", // Complex index
      numberPrefix: "B." // Uppercase letter prefix
    },
    {
        id: subClauseZ.id,
        index: "3.3", // Complex index
        numberPrefix: "C." // Uppercase letter prefix
    }
  ]
});

// Create the root clause with at least 3 sub-clauses and a revision process
const level1Clause = new Clause({
  name: "主协议框架",
  readme: "涵盖所有条款的总体框架。",
  revisionProcessId: "revproc_zyxwvu98", // Example revision process ID for the root clause
  localMapping: {
    "{MASTER_AGREEMENT_SIGNATORY_x5y4z3w2v1}": "阿尔法首席执行官"
  },
  subClauses: [
    {
      id: level2Clause.id,
      index: 1, // Numeric index
      numberPrefix: "①" // Circled number
    },
    {
      id: simpleClause.id,
      index: 2, // Numeric index
      numberPrefix: "②" // Circled number
    },
    {
      id: compositeClause.id,
      index: 3, // Numeric index
      numberPrefix: "③" // Circled number
    }
  ]
});

// Save YAML for level 1 (root) clause data
saveAsYaml('level_1_root_clause_data.yaml', {
  id: level1Clause.id,
  name: level1Clause.name,
  readme: level1Clause.readme,
  mappings: level1Clause.localMapping,
  subClauses: level1Clause.subClauses
});

// --- Output Generation for Four-Level Test ---

console.log("\n--- Generating Four-Level Nested Clause ---");
writeOutput(`level_1_nested_clause_${level1Clause.id}.md`, level1Clause.toMarkdown());
writeOutput(`level_1_nested_clause_${level1Clause.id}.html`, level1Clause.toHtml());

console.log("\n--- Four-level nested clause files generated successfully. ---");