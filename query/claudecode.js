var fs = require('fs');
var yaml = require('js-yaml');

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

// Chart of Accounts structure
const chartOfAccounts = {
    "总账":{ id: 0, name: "总账", debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "银行存款": { id: 1, name: "银行存款",ftitle:"总账",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "现金": { id: 2, name: "现金", ftitle:"总账", debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "微信零钱": { id: 2.1, name: "微信零钱", ftitle:"现金", debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "raw": { id: 10, name: "raw", ftitle:"总账",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "raw.food": { id: 10.1, name: "raw.food", ftitle:"raw",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "raw.med": { id: 10.2, name: "raw.med", ftitle:"raw",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "raw.site": { id: 10.3, name: "raw.site", ftitle:"raw",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "raw.site.bj1": { id: "10.3.1.", name: "raw.site.bj1", ftitle:"raw.site",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "raw.site.wz": { id: "10.3.2.", name: "raw.site.wz", ftitle:"raw.site",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "raw.fun": { id: 10.4, name: "raw.fun", ftitle:"raw",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "raw.shell": { id: 10.5, name: "raw.shell", ftitle:"raw",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "raw.supply": { id: 10.6, name: "raw.supply", ftitle:"raw",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "ego": { id: 20, name: "ego", ftitle:"总账",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "ego.it": { id: 20.1, name: "ego.it", ftitle:"ego",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "donation": { id: 30, name: "donation", ftitle:"总账",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "donation.parent": { id: 30.1, name: "donation.parent", ftitle:"donation",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "donation.younger": { id: 30.2, name: "donation.younger", ftitle:"donation",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "donation.else": { id: 30.3, name: "donation.else", ftitle:"donation",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "PSMD": { id: 100, name: "PSMD", ftitle:"总账",  debit:{"rmb": 0.0},credit:{"rmb": 0.0},balance: { "rmb": 0.0 } },
    "xuemen": { id: 1000, name: "xuemen", ftitle:"总账",debit:{"rmb": 0.0},credit:{"rmb": 0.0}, balance: { "rmb": 0.0 } }
};

// Load AER data from yaml files
function loadAER(year) {
    var AERmap = new Object();
    var voucherfolder = "../../ego/data/voucher/" + year;
    if (fs.existsSync(voucherfolder)) {
        fs.readdirSync(voucherfolder).forEach(file => {
            if (file.substr(0, 4) == "AER.") {
                var AER = yaml.load(fs.readFileSync(voucherfolder + "/" + file, 'utf8'), { schema: yaml.CORE_SCHEMA });
                AERmap[file] = AER;
            }
        });
    }
    return AERmap;
}

// Load AER data by year and month
function loadAERByMonth(year, month) {
    var AERmap = new Object();
    var voucherfolder = "../../ego/data/voucher/" + year;
    if (fs.existsSync(voucherfolder)) {
        fs.readdirSync(voucherfolder).forEach(file => {
            if (file.substr(0, 4) == "AER.") {
                var AER = yaml.load(fs.readFileSync(voucherfolder + "/" + file, 'utf8'), { schema: yaml.CORE_SCHEMA });
                // Filter by month if specified
                if (month && AER.date) {
                    const entryMonth = new Date(AER.date).getMonth() + 1;
                    if (entryMonth === month) {
                        //log("find AER:",month,file,entryMonth);
                        AERmap[file] = AER;
                    }
                } else {
                    AERmap[file] = AER;
                }
            }
        });
    }
    return AERmap;
}

// Process AER data into account balances with hierarchical aggregation
function processAERData(year = 2025, month = null) {
    const AERmap = month ? loadAERByMonth(year, month) : loadAER(year);
    const accounts = JSON.parse(JSON.stringify(chartOfAccounts)); // Deep copy
    
    // Helper function to update account and all its parents
    function updateAccountAndParents(accountTitle, amount, isDebit) {
        let current = accountTitle;
        const visited = new Set();
        
        while (current && accounts[current] && !visited.has(current)) {
            visited.add(current);
            const account = accounts[current];
            
            if (isDebit) {
                account.debit.rmb += amount;
                account.balance.rmb += amount;
            } else {
                account.credit.rmb += amount;
                account.balance.rmb -= amount;
            }
            
            // Move to parent using ftitle
            current = account.ftitle;
        }
    }
    
    // Process all transactions
    Object.values(AERmap).forEach(entry => {
        if (entry.AccountingEntry) {
            // Process debits
            if (entry.AccountingEntry.debit) {
                entry.AccountingEntry.debit.forEach(debit => {
                    updateAccountAndParents(debit.AccountTitle, debit.amount, true);
                });
            }
            
            // Process credits
            if (entry.AccountingEntry.credit) {
                entry.AccountingEntry.credit.forEach(credit => {
                    updateAccountAndParents(credit.AccountTitle, credit.amount, false);
                });
            }
        }
    });
    
    return accounts;
}

// Process AER data with initial account balances
function processAERDataWithInitial(year, month, initialAccounts) {
    const AERmap = month ? loadAERByMonth(year, month) : loadAER(year);
    const accounts = JSON.parse(JSON.stringify(initialAccounts)); // Start with initial balances
    
    // Helper function to update account and all its parents
    function updateAccountAndParents(accountTitle, amount, isDebit) {
        let current = accountTitle;
        const visited = new Set();
        
        while (current && accounts[current] && !visited.has(current)) {
            visited.add(current);
            const account = accounts[current];
            
            if (isDebit) {
                account.debit.rmb += amount;
                account.balance.rmb += amount;
            } else {
                account.credit.rmb += amount;
                account.balance.rmb -= amount;
            }
            
            // Move to parent using ftitle
            current = account.ftitle;
        }
    }
    
    // Process all transactions
    Object.values(AERmap).forEach(entry => {
        if (entry.AccountingEntry) {
            // Process debits
            if (entry.AccountingEntry.debit) {
                entry.AccountingEntry.debit.forEach(debit => {
                    updateAccountAndParents(debit.AccountTitle, debit.amount, true);
                });
            }
            
            // Process credits
            if (entry.AccountingEntry.credit) {
                entry.AccountingEntry.credit.forEach(credit => {
                    updateAccountAndParents(credit.AccountTitle, credit.amount, false);
                });
            }
        }
    });
    
    return accounts;
}

// Process opening and closing balances for a specific period
function processPeriodBalances(year, month) {
    // Get opening balance (end of previous period)
    let openingAccounts = JSON.parse(JSON.stringify(chartOfAccounts));
    
    // Calculate opening balance by processing all transactions up to previous period
    for (let y = 2020; y <= year; y++) {
        const monthsInYear = (y === year) ? month - 1 : 12;
        for (let m = 1; m <= monthsInYear; m++) {
            const periodAccounts = processAERDataWithInitial(y, m, openingAccounts);
            openingAccounts = periodAccounts;
        }
    }
    
    // Get closing balance (end of current period)
    const closingAccounts = processAERDataWithInitial(year, month, openingAccounts);
    
    return {
        opening: openingAccounts,
        closing: closingAccounts,
        year: year,
        month: month
    };
}

// Generate period summary with opening/closing balances
function generatePeriodSummary(year, month = null) {
    let periods = [];
    
    if (month) {
        // Single month
        const periodData = processPeriodBalances(year, month);
        periods.push(periodData);
    } else {
        // All months in year
        for (let m = 1; m <= 12; m++) {
            const periodData = processPeriodBalances(year, m);
            periods.push(periodData);
        }
    }
    
    return periods;
}

// Generate Balance Sheet with hierarchical aggregation
function generateBalanceSheet(accounts) {
    const assets = {};
    const liabilities = {};
    const equity = {};
    
    // Categorize accounts based on hierarchy - only include top-level accounts
    Object.entries(accounts).forEach(([key, account]) => {
        const balance = account.balance.rmb;
        
        // Only include accounts that are direct children of '总账' (top-level accounts)
        if (key === '总账') return; // Skip root
        if (account.ftitle !== '总账') return; // Skip non-top-level accounts
        
        // Assets - all top-level accounts except donation
        if (key !== 'donation') {
            assets[key] = { 
                name: account.name, 
                balance: balance 
            };
        }
        // Liabilities - donation account goes to liabilities
        else if (key === 'donation') {
            liabilities[key] = { 
                name: account.name, 
                balance: balance 
            };
        }
    });
    
    const totalAssets = Object.values(assets).reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = 0; // No liabilities in this structure
    const totalEquity = Object.values(equity).reduce((sum, acc) => sum + acc.balance, 0);
    
    return {
        statementName: "Balance Sheet",
        assets: {
            accounts: assets,
            total: totalAssets
        },
        liabilities: {
            accounts: liabilities,
            total: totalLiabilities
        },
        equity: {
            accounts: equity,
            total: totalEquity
        },
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity
    };
}

// Generate Income Statement with hierarchical aggregation
function generateIncomeStatement(accounts) {
    // Revenue accounts (donations)
    const revenue = {};
    Object.entries(accounts).forEach(([key, account]) => {
        if (key === 'donation') {
            revenue[key] = { ...account, amount: account.balance.rmb };
        }
    });
    
    // Expense accounts (raw materials, etc.)
    const expenses = {};
    Object.entries(accounts).forEach(([key, account]) => {
        if (key === 'raw') {
            expenses[key] = { ...account, amount: account.balance.rmb };
        }
    });
    
    const totalRevenue = Object.values(revenue).reduce((sum, acc) => sum + acc.amount, 0);
    const totalExpenses = Object.values(expenses).reduce((sum, acc) => sum + acc.amount, 0);
    const netIncome = totalRevenue - totalExpenses;
    
    return {
        statementName: "Income Statement",
        revenue: {
            accounts: revenue,
            total: totalRevenue
        },
        expenses: {
            accounts: expenses,
            total: totalExpenses
        },
        netIncome: netIncome
    };
}

// Generate Cash Flow Statement with hierarchical aggregation
function generateCashFlowStatement(accounts) {
    // Operating activities - use parent accounts for aggregation
    const operatingActivities = {};
    Object.entries(accounts).forEach(([key, account]) => {
        if (key === 'raw' || key === 'donation') {
            operatingActivities[key] = { ...account, cashFlow: account.balance.rmb };
        }
    });
    
    // Cash and cash equivalents
    const cashAccounts = {};
    Object.entries(accounts).forEach(([key, account]) => {
        if (key === '银行存款' || key === '现金' || key === '微信零钱') {
            cashAccounts[key] = { ...account, cashFlow: account.balance.rmb };
        }
    });
    
    const netCashOperating = Object.values(operatingActivities).reduce((sum, acc) => sum + acc.cashFlow, 0);
    const netCashInvesting = 0;
    const netCashFinancing = 0;
    const netChangeInCash = Object.values(cashAccounts).reduce((sum, acc) => sum + acc.cashFlow, 0);
    
    return {
        statementName: "Cash Flow Statement",
        operatingActivities: {
            accounts: operatingActivities,
            netCashFlow: netCashOperating
        },
        investingActivities: {
            accounts: {},
            netCashFlow: netCashInvesting
        },
        financingActivities: {
            accounts: {},
            netCashFlow: netCashFinancing
        },
        netChangeInCash: netChangeInCash
    };
}

// Display opening and closing balances for each subject
function displaySubjectBalances(periods) {
    console.log("=== 各科目期初期末余额 ===\n");
    
    periods.forEach(period => {
        const year = period.year;
        const month = period.month;
        console.log(`${year}年${month}月:`);
        
        const balanceData = [];
        Object.entries(chartOfAccounts).forEach(([key, account]) => {
            if (key !== '总账') { // Skip root account
                const openingBalance = period.opening[key] ? period.opening[key].balance.rmb : 0;
                const closingBalance = period.closing[key] ? period.closing[key].balance.rmb : openingBalance;
                const change = closingBalance - openingBalance;
                
                if (Math.abs(openingBalance) > 0.01 || Math.abs(closingBalance) > 0.01 || Math.abs(change) > 0.01) {
                    balanceData.push({
                        '科目名称': account.name,
                        '期初余额': openingBalance.toFixed(2),
                        '期末余额': closingBalance.toFixed(2),
                        '变动': change.toFixed(2)
                    });
                }
            }
        });
        
        if (balanceData.length > 0) {
            console.table(balanceData);
        }
        console.log("");
    });
}

// Generate financial statements for specific period
function generateFinancialStatementsForPeriod(period) {
    const accounts = period.closing;
    
    const balanceSheet = generateBalanceSheet(accounts);
    const incomeStatement = generateIncomeStatement(accounts);
    const cashFlowStatement = generateCashFlowStatement(accounts);
    
    return {
        period: period,
        balanceSheet,
        incomeStatement,
        cashFlowStatement
    };
}

// Display financial statements for specific period
function displayFinancialStatementsForPeriod(statements) {
    const period = statements.period;
    console.log(`\n=== ${period.year}年${period.month}月财务报表 ===\n`);
    
    // Balance Sheet
    console.log("1. 资产负债表");
    console.log("==============");
    
    const assetsData = [];
    Object.entries(statements.balanceSheet.assets.accounts).forEach(([key, acc]) => {
        assetsData.push({ '资产科目': acc.name, '金额': acc.balance.toFixed(2) });
    });
    assetsData.push({ '资产科目': '资产总计', '金额': statements.balanceSheet.assets.total.toFixed(2) });
    console.table(assetsData);
    
    const liabilitiesData = [];
    Object.entries(statements.balanceSheet.liabilities.accounts).forEach(([key, acc]) => {
        liabilitiesData.push({ '负债科目': acc.name, '金额': acc.balance.toFixed(2) });
    });
    if (liabilitiesData.length > 0) {
        console.log("\n负债:");
        console.table(liabilitiesData);
    }
    
    const equityData = [];
    Object.entries(statements.balanceSheet.equity.accounts).forEach(([key, acc]) => {
        equityData.push({ '权益科目': acc.name, '金额': acc.balance.toFixed(2) });
    });
    if (equityData.length > 0) {
        console.log("\n权益:");
        console.table(equityData);
    }
    
    console.log(`负债和权益总计: ${statements.balanceSheet.totalLiabilitiesAndEquity.toFixed(2)}`);
    
    // Income Statement
    console.log("\n\n2. 利润表");
    console.log("==========");
    
    const revenueData = [];
    Object.entries(statements.incomeStatement.revenue.accounts).forEach(([key, acc]) => {
        revenueData.push({ '收入科目': acc.name, '金额': acc.amount.toFixed(2) });
    });
    if (revenueData.length > 0) {
        revenueData.push({ '收入科目': '收入合计', '金额': statements.incomeStatement.revenue.total.toFixed(2) });
        console.table(revenueData);
    }
    
    const expensesData = [];
    Object.entries(statements.incomeStatement.expenses.accounts).forEach(([key, acc]) => {
        expensesData.push({ '费用科目': acc.name, '金额': acc.amount.toFixed(2) });
    });
    if (expensesData.length > 0) {
        expensesData.push({ '费用科目': '费用合计', '金额': statements.incomeStatement.expenses.total.toFixed(2) });
        console.table(expensesData);
    }
    console.log(`净利润: ${statements.incomeStatement.netIncome.toFixed(2)}`);
    
    // Cash Flow Statement
    console.log("\n\n3. 现金流量表");
    console.log("=============");
    
    const operatingData = [];
    Object.entries(statements.cashFlowStatement.operatingActivities.accounts).forEach(([key, acc]) => {
        operatingData.push({ '经营科目': acc.name, '金额': acc.cashFlow.toFixed(2) });
    });
    if (operatingData.length > 0) {
        operatingData.push({ '经营科目': '经营活动净额', '金额': statements.cashFlowStatement.operatingActivities.netCashFlow.toFixed(2) });
        console.table(operatingData);
    }
    
    console.log(`现金及现金等价物净增加额: ${statements.cashFlowStatement.netChangeInCash.toFixed(2)}`);
}

// Main execution function
function generateFinancialStatements(year = 2025, month = null) {
    const periods = generatePeriodSummary(year, month);
    
    // Display subject balances
    displaySubjectBalances(periods);
    
    // Generate and display financial statements for each period
    const allStatements = [];
    periods.forEach(period => {
        const statements = generateFinancialStatementsForPeriod(period);
        displayFinancialStatementsForPeriod(statements);
        allStatements.push(statements);
    });
    
    return allStatements;
}

// Command line argument handling
const args = process.argv.slice(2);
let year = 2025;
let month = null;

if (args.length > 0) {
    year = parseInt(args[0]);
    if (args.length > 1) {
        month = parseInt(args[1]);
    }
}

console.log(`=== 财务报告系统 (${year}年${month ? month + '月' : '全年'}) ===\n`);

// Generate all reports
const allFinancialStatements = generateFinancialStatements(year, month);

// Export the financial statements as JSON
const exportData = {
    year: year,
    month: month,
    periods: allFinancialStatements.map(statements => ({
        year: statements.period.year,
        month: statements.period.month,
        openingBalances: statements.period.opening,
        closingBalances: statements.period.closing,
        balanceSheet: statements.balanceSheet,
        incomeStatement: statements.incomeStatement,
        cashFlowStatement: statements.cashFlowStatement
    }))
};

fs.writeFileSync('financial_statements.json', JSON.stringify(exportData, null, 2));
console.log(`\n财务报告已保存到 financial_statements.json`);

// Export subject balances summary
const subjectBalancesSummary = [];
allFinancialStatements.forEach(statements => {
    const periodSummary = {
        year: statements.period.year,
        month: statements.period.month,
        subjects: {}
    };
    
    Object.entries(chartOfAccounts).forEach(([key, account]) => {
        if (key !== '总账') {
            const openingBalance = statements.period.opening[key] ? statements.period.opening[key].balance.rmb : 0;
            const closingBalance = statements.period.closing[key] ? statements.period.closing[key].balance.rmb : openingBalance;
            const change = closingBalance - openingBalance;
            
            if (Math.abs(openingBalance) > 0.01 || Math.abs(closingBalance) > 0.01 || Math.abs(change) > 0.01) {
                periodSummary.subjects[key] = {
                    name: account.name,
                    openingBalance: openingBalance,
                    closingBalance: closingBalance,
                    change: change
                };
            }
        }
    });
    
    subjectBalancesSummary.push(periodSummary);
});

fs.writeFileSync('subject_balances.json', JSON.stringify(subjectBalancesSummary, null, 2));
console.log(`各科目期初期末余额已保存到 subject_balances.json`);

module.exports = {
    generateFinancialStatements,
    generatePeriodSummary,
    displaySubjectBalances,
    displayFinancialStatementsForPeriod
};