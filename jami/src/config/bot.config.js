require('dotenv').config();

module.exports = {
  jami: {
    accountId: process.env.JAMI_ACCOUNT_ID || 'your-account-id',
    daemon: {
      host: process.env.JAMI_DAEMON_HOST || 'localhost',
      port: parseInt(process.env.JAMI_DAEMON_PORT) || 8080
    }
  },
  
  meeting: {
    startup: {
      title: "创业筹备会议",
      description: "引导对话各方发言、表决，整理创业协议",
      agenda: [
        "介绍会议流程",
        "确定会议参与者",
        "制定基本规则",
        "讨论创业方向",
        "制定角色架构",
        "制定决策程序",
        "表决通过协议"
      ]
    }
  },

  voting: {
    requireUnanimousFirst: true,
    defaultThreshold: 0.67,
    timeoutMinutes: 30
  },

  agreement: {
    template: {
      title: "创业协议",
      sections: [
        "前言",
        "角色定义",
        "决策程序",
        "条款内容",
        "修订记录"
      ]
    }
  }
};