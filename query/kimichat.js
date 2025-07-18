// ============================================================
// 1. 依赖
// ============================================================
const fs   = require('fs');
const yaml = require('js-yaml');

// ============================================================
// 2. 会计科目初始结构
// ============================================================
const account = {
  "总账":             { id: 0, name: "总账", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "银行存款":         { id: 1, name: "银行存款", ftitle: "总账", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "现金":             { id: 2, name: "现金", ftitle: "总账", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "微信零钱":         { id: 2.1, name: "微信零钱", ftitle: "现金", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "raw":              { id: 10, name: "raw", ftitle: "总账", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "raw.food":         { id: 10.1, name: "raw.food", ftitle: "raw", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "raw.med":          { id: 10.2, name: "raw.med", ftitle: "raw", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "raw.site":         { id: 10.3, name: "raw.site", ftitle: "raw", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "raw.site.bj1":     { id: "10.3.1.", name: "raw.site.bj1", ftitle: "raw.site", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "raw.site.wz":      { id: "10.3.2.", name: "raw.site.wz", ftitle: "raw.site", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "raw.fun":          { id: 10.4, name: "raw.fun", ftitle: "raw", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "raw.shell":        { id: 10.5, name: "raw.shell", ftitle: "raw", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "raw.supply":       { id: 10.6, name: "raw.supply", ftitle: "raw", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "ego":              { id: 20, name: "ego", ftitle: "总账", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "ego.it":           { id: 20.1, name: "ego.it", ftitle: "ego", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "donation":         { id: 30, name: "donation", ftitle: "总账", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "donation.parent":  { id: 30.1, name: "donation.parent", ftitle: "donation", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "donation.younger": { id: 30.2, name: "donation.younger", ftitle: "donation", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "donation.else":    { id: 30.3, name: "donation.else", ftitle: "donation", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "PSMD":             { id: 100, name: "PSMD", ftitle: "总账", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } },
  "xuemen":           { id: 1000, name: "xuemen", ftitle: "总账", debit: { rmb: 0 }, credit: { rmb: 0 }, balance: { rmb: 0 } }
};

// ============================================================
// 3. 工具：递归向上汇总余额
// ============================================================
function updateParentBalances(accountName, amount, isDebit) {
  let current = account[accountName];
  if (!current) return;

  while (current.ftitle) {
    const parent = account[current.ftitle];
    if (!parent) break;

    if (isDebit) {
      parent.debit.rmb += amount;
      parent.balance.rmb += amount;
    } else {
      parent.credit.rmb += amount;
      parent.balance.rmb -= amount;
    }
    current = parent;
  }
}

// ============================================================
// 4. 加载 AER 凭证
// ============================================================
function loadAER(year) {
  const AERmap = {};
  const voucherFolder = `../../ego/data/voucher/${year}`;
  fs.readdirSync(voucherFolder).forEach(file => {
    if (file.startsWith("AER.")) {
      const AER = yaml.load(fs.readFileSync(`${voucherFolder}/${file}`, 'utf8'), { schema: yaml.CORE_SCHEMA });
      AERmap[file] = AER;
    }
  });
  return AERmap;
}

// ============================================================
// 5. 处理所有凭证，更新科目余额
// ============================================================
function processAER(AERmap) {
  // 清零
  for (const acc in account) {
    account[acc].debit.rmb = 0;
    account[acc].credit.rmb = 0;
    account[acc].balance.rmb = 0;
  }

  // 逐条处理
  for (const file in AERmap) {
    const AER = AERmap[file];

    AER.AccountingEntry.debit.forEach(entry => {
      const accName = entry.AccountTitle;
      const amount  = entry.amount;
      account[accName].debit.rmb += amount;
      account[accName].balance.rmb += amount;
      updateParentBalances(accName, amount, true);
    });

    AER.AccountingEntry.credit.forEach(entry => {
      const accName = entry.AccountTitle;
      const amount  = entry.amount;
      account[accName].credit.rmb += amount;
      account[accName].balance.rmb -= amount;
      updateParentBalances(accName, amount, false);
    });
  }
}

// ============================================================
// 6. 三大报表
// ============================================================

// 6.1 资产负债表
function generateBalanceSheet() {
  return {
    assets: {
      流动资产: {
        现金:        account["现金"].balance.rmb,
        银行存款:    account["银行存款"].balance.rmb,
        原材料:      account["raw"].balance.rmb
      },
      非流动资产: {
        固定资产:    account["ego"].balance.rmb
      }
    },
    liabilities: {
      流动负债: {},
      非流动负债: {}
    },
    equity: {
      所有者权益: {
        捐赠收入:    account["donation"].balance.rmb,
        未分配利润:  account["xuemen"].balance.rmb
      }
    }
  };
}

// 6.2 利润表
function generateIncomeStatement() {
  const revenue = {
    捐赠收入: Math.abs(account["donation"].credit.rmb),
    其他收入: 0
  };
  const expenses = {
    原材料支出: account["raw"].debit.rmb,
    IT支出:     account["ego.it"].debit.rmb,
    其他支出:   0
  };
  const netIncome = Object.values(revenue).reduce((a, b) => a + b, 0) -
                    Object.values(expenses).reduce((a, b) => a + b, 0);
  return { revenue, expenses, netIncome };
}

// 6.3 现金流量表
function generateCashFlowStatement() {
  const operating = {
    捐赠收入: Math.abs(account["donation"].credit.rmb),
    原材料采购: -account["raw"].debit.rmb,
    IT支出:     -account["ego.it"].debit.rmb,
    经营活动现金流量净额: Math.abs(account["donation"].credit.rmb) -
                          account["raw"].debit.rmb -
                          account["ego.it"].debit.rmb
  };
  const investing = {
    购建固定资产: -account["ego"].debit.rmb,
    投资活动现金流量净额: -account["ego"].debit.rmb
  };
  const financing = {};
  const netChange = operating["经营活动现金流量净额"] + investing["投资活动现金流量净额"];
  const cashAtBeginning = 0; // 可改为读取期初数
  const cashAtEnd = cashAtBeginning + netChange;

  return {
    operatingActivities: operating,
    investingActivities: investing,
    financingActivities: financing,
    netChangeInCash: netChange,
    cashAtBeginning,
    cashAtEnd
  };
}

// ============================================================
// 7. 主入口
// ============================================================
function generateFinancialStatements(year) {
  const AERmap = loadAER(year);
  processAER(AERmap);

  return {
    balanceSheet:     generateBalanceSheet(),
    incomeStatement:  generateIncomeStatement(),
    cashFlowStatement: generateCashFlowStatement()
  };
}

// ============================================================
// 8. 运行示例
// ============================================================
if (require.main === module) {
  const year = process.argv[2] || "2025";
  const fsReports = generateFinancialStatements(year);

  console.log("=== 资产负债表 ===");
  console.log(JSON.stringify(fsReports.balanceSheet, null, 2));

  console.log("\n=== 利润表 ===");
  console.log(JSON.stringify(fsReports.incomeStatement, null, 2));

  console.log("\n=== 现金流量表 ===");
  console.log(JSON.stringify(fsReports.cashFlowStatement, null, 2));
}