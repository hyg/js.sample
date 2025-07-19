class AgreementGenerator {
  constructor(meetingManager) {
    this.meetingManager = meetingManager;
    this.templates = {
      markdown: this.getMarkdownTemplate(),
      json: this.getJsonTemplate(),
      html: this.getHtmlTemplate()
    };
  }

  generateAgreement(meetingId, format = 'markdown') {
    const meeting = this.meetingManager.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('会议不存在');
    }

    if (meeting.state !== 'completed') {
      throw new Error('会议未完成，无法生成协议');
    }

    const agreement = meeting.agreement;
    
    switch (format.toLowerCase()) {
      case 'markdown':
        return this.generateMarkdown(agreement);
      case 'json':
        return this.generateJson(agreement);
      case 'html':
        return this.generateHtml(agreement);
      default:
        throw new Error(`不支持的格式: ${format}`);
    }
  }

  generateMarkdown(agreement) {
    let content = `# ${agreement.title}\n\n`;

    // 前言部分
    if (agreement.sections.preface.length > 0) {
      content += `## 前言\n\n`;
      agreement.sections.preface.forEach((line, index) => {
        content += `${line}\n`;
      });
      content += '\n';
    }

    // 角色层级
    content += this.generateRolesSection(agreement);

    // 决策程序层级
    content += this.generateProceduresSection(agreement);

    // 条款内容
    content += this.generateTermsSection(agreement);

    // 不产生决策的条款
    content += this.generateNonDecisionTerms(agreement);

    // 修订历史
    content += this.generateRevisionHistory(agreement);

    // 会议记录摘要
    content += this.generateMeetingSummary(agreement);

    return content;
  }

  generateRolesSection(agreement) {
    let content = `## 角色定义\n\n`;

    if (!agreement.sections.roles || agreement.sections.roles.length === 0) {
      content += `暂无定义的角色。\n\n`;
      return content;
    }

    agreement.sections.roles.forEach((level, index) => {
      content += `### 第${index + 1}级角色\n\n`;
      
      level.forEach(role => {
        content += `#### ${role.name}\n`;
        content += `- **描述**: ${role.description}\n`;
        content += `- **职责**: ${role.responsibilities?.join(', ') || '未定义'}\n`;
        content += `- **任免程序**: ${role.appointedBy || '初始设定'}\n`;
        content += `- **任期**: ${role.term || '未定义'}\n`;
        content += `- **投票权重**: ${role.voteWeight || 1}\n\n`;
      });
    });

    return content;
  }

  generateProceduresSection(agreement) {
    let content = `## 决策程序\n\n`;

    if (!agreement.sections.procedures || agreement.sections.procedures.length === 0) {
      content += `暂无定义的决策程序。\n\n`;
      return content;
    }

    agreement.sections.procedures.forEach((level, index) => {
      content += `### 第${index + 1}级决策程序\n\n`;
      
      level.forEach(procedure => {
        content += `#### ${procedure.name}\n`;
        content += `- **描述**: ${procedure.description}\n`;
        content += `- **适用范围**: ${procedure.scope || '所有事项'}\n`;
        content += `- **表决阈值**: ${(procedure.threshold * 100).toFixed(0)}%\n`;
        content += `- **修订程序**: ${procedure.revisedBy || '不可修订'}\n`;
        content += `- **制定时间**: ${procedure.approvedAt?.toLocaleString() || '未知'}\n\n`;
      });
    });

    return content;
  }

  generateTermsSection(agreement) {
    let content = `## 条款内容\n\n`;

    if (!agreement.sections.terms || agreement.sections.terms.length === 0) {
      content += `暂无定义的条款。\n\n`;
      return content;
    }

    agreement.sections.terms.forEach((term, index) => {
      content += `${index + 1}. **${term.title || '条款'}**\n`;
      content += `   ${term.content}\n`;
      content += `   - **修订程序**: ${term.revisedBy || '初始设定'}\n`;
      content += `   - **通过时间**: ${term.approvedAt?.toLocaleString() || '未知'}\n`;
      content += `   - **条款编号**: ${term.id || index + 1}\n\n`;
    });

    return content;
  }

  generateNonDecisionTerms(agreement) {
    let content = `## 不产生决策的条款\n\n`;

    if (!agreement.sections.misc || agreement.sections.misc.length === 0) {
      content += `暂无其他条款。\n\n`;
      return content;
    }

    agreement.sections.misc.forEach((term, index) => {
      content += `${index + 1}. ${term.content}\n`;
      content += `   - **类型**: ${term.type || '说明性条款'}\n`;
      content += `   - **添加时间**: ${term.addedAt?.toLocaleString() || '未知'}\n\n`;
    });

    return content;
  }

  generateRevisionHistory(agreement) {
    let content = `## 修订历史\n\n`;

    const allItems = [
      ...agreement.sections.roles.flat(),
      ...agreement.sections.procedures.flat(),
      ...agreement.sections.terms
    ].filter(item => item.revisionHistory && item.revisionHistory.length > 0);

    if (allItems.length === 0) {
      content += `暂无修订记录。\n\n`;
      return content;
    }

    allItems.forEach(item => {
      content += `### ${item.name || item.title || '条款'}\n`;
      item.revisionHistory.forEach(revision => {
        content += `- **版本**: ${revision.version} (${revision.approvedAt?.toLocaleString()})\n`;
        content += `  **变更**: ${revision.changes}\n`;
      });
      content += '\n';
    });

    return content;
  }

  generateMeetingSummary(agreement) {
    if (!agreement.history) {
      return '';
    }

    let content = `## 会议记录摘要\n\n`;
    
    content += `### 参与者\n`;
    agreement.history.participants.forEach(p => {
      content += `- ${p.name} (${p.role || '参与者'})\n`;
    });
    content += '\n';

    content += `### 表决记录\n`;
    agreement.history.votes.forEach(vote => {
      content += `- ${vote.proposal?.description || '表决'}: `;
      content += `${vote.result?.passed ? '通过' : '未通过'} `;
      content += `(${vote.result?.yesVotes || 0}/${vote.participants?.length || 0})\n`;
    });
    content += '\n';

    content += `### 会议统计\n`;
    content += `- 消息总数: ${agreement.history.messages?.length || 0}\n`;
    content += `- 表决次数: ${agreement.history.votes?.length || 0}\n`;
    content += `- 协议版本: ${agreement.version}\n`;
    content += `- 最后修改: ${agreement.lastModified?.toLocaleString()}\n\n`;

    return content;
  }

  generateJson(agreement) {
    return JSON.stringify({
      title: agreement.title,
      version: agreement.version,
      createdAt: agreement.createdAt,
      lastModified: agreement.lastModified,
      sections: agreement.sections,
      hierarchy: this.buildHierarchy(agreement),
      dependencies: this.buildDependencies(agreement),
      statistics: this.generateStatistics(agreement)
    }, null, 2);
  }

  generateHtml(agreement) {
    const markdown = this.generateMarkdown(agreement);
    return this.markdownToHtml(markdown);
  }

  buildHierarchy(agreement) {
    const hierarchy = {
      roles: {},
      procedures: {}
    };

    // 构建角色层级图
    if (agreement.sections.roles.length > 0) {
      agreement.sections.roles.forEach((level, levelIndex) => {
        level.forEach(role => {
          hierarchy.roles[role.id || role.name] = {
            level: levelIndex,
            appoints: [],
            appointedBy: role.appointedBy || null,
            name: role.name,
            description: role.description
          };
        });
      });

      // 建立任免关系
      Object.keys(hierarchy.roles).forEach(roleId => {
        const role = hierarchy.roles[roleId];
        if (role.appointedBy) {
          const appointingRole = Object.values(hierarchy.roles)
            .find(r => r.name === role.appointedBy || r.id === role.appointedBy);
          if (appointingRole) {
            appointingRole.appoints.push(roleId);
          }
        }
      });
    }

    // 构建程序层级图
    if (agreement.sections.procedures.length > 0) {
      agreement.sections.procedures.forEach((level, levelIndex) => {
        level.forEach(procedure => {
          hierarchy.procedures[procedure.id || procedure.name] = {
            level: levelIndex,
            revises: [],
            revisedBy: procedure.revisedBy || null,
            name: procedure.name,
            description: procedure.description
          };
        });
      });

      // 建立修订关系
      Object.keys(hierarchy.procedures).forEach(procId => {
        const proc = hierarchy.procedures[procId];
        if (proc.revisedBy) {
          const revisingProc = Object.values(hierarchy.procedures)
            .find(p => p.name === proc.revisedBy || p.id === proc.revisedBy);
          if (revisingProc) {
            revisingProc.revises.push(procId);
          }
        }
      });
    }

    return hierarchy;
  }

  buildDependencies(agreement) {
    const dependencies = {
      roles: [],
      procedures: [],
      terms: []
    };

    // 角色依赖关系
    if (agreement.sections.roles.length > 0) {
      agreement.sections.roles.forEach(level => {
        level.forEach(role => {
          dependencies.roles.push({
            id: role.id || role.name,
            name: role.name,
            dependsOn: role.appointedBy ? [role.appointedBy] : [],
            requiredBy: []
          });
        });
      });
    }

    // 程序依赖关系
    if (agreement.sections.procedures.length > 0) {
      agreement.sections.procedures.forEach(level => {
        level.forEach(procedure => {
          dependencies.procedures.push({
            id: procedure.id || procedure.name,
            name: procedure.name,
            dependsOn: procedure.revisedBy ? [procedure.revisedBy] : [],
            requiredBy: []
          });
        });
      });
    }

    // 条款依赖关系
    if (agreement.sections.terms.length > 0) {
      agreement.sections.terms.forEach(term => {
        dependencies.terms.push({
          id: term.id,
          title: term.title || '条款',
          dependsOn: term.revisedBy ? [term.revisedBy] : [],
          requiredBy: []
        });
      });
    }

    return dependencies;
  }

  generateStatistics(agreement) {
    return {
      roles: {
        total: agreement.sections.roles?.flat().length || 0,
        levels: agreement.sections.roles?.length || 0
      },
      procedures: {
        total: agreement.sections.procedures?.flat().length || 0,
        levels: agreement.sections.procedures?.length || 0
      },
      terms: {
        total: agreement.sections.terms?.length || 0
      },
      misc: {
        total: agreement.sections.misc?.length || 0
      },
      lastModified: agreement.lastModified
    };
  }

  markdownToHtml(markdown) {
    // 简单的markdown转html转换
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');
  }

  getMarkdownTemplate() {
    return `# 创业协议

## 前言

[在此填写协议前言]

## 角色定义

### 第1级角色

#### 创始人
- **描述**: 公司创始人
- **职责**: 战略决策、团队建设、外部关系
- **任免程序**: 初始设定
- **任期**: 长期
- **投票权重**: 2

## 决策程序

### 第1级决策程序

#### 重大事项决策
- **描述**: 重大事项的决策程序
- **适用范围**: 公司战略、股权变更、重大投资
- **表决阈值**: 67%
- **修订程序**: 不可修订
- **制定时间**: [时间]

## 条款内容

1. **公司名称**
   - **内容**: [公司名称]
   - **修订程序**: 第1级决策程序
   - **通过时间**: [时间]

## 不产生决策的条款

1. **公司愿景**
   - **内容**: [公司愿景描述]
   - **类型**: 说明性条款
   - **添加时间**: [时间]

## 修订历史

### 公司名称
- **版本**: 1 ([时间])
  **变更**: 初始制定

## 会议记录摘要

### 参与者
- [参与者列表]

### 表决记录
- [表决记录]

### 会议统计
- [统计信息]`;
  }

  getJsonTemplate() {
    return {
      title: "创业协议",
      version: 1,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      sections: {
        preface: ["协议前言"],
        roles: [
          [
            {
              id: "founder",
              name: "创始人",
              description: "公司创始人",
              responsibilities: ["战略决策", "团队建设", "外部关系"],
              appointedBy: null,
              term: "长期",
              voteWeight: 2
            }
          ]
        ],
        procedures: [
          [
            {
              id: "major_decision",
              name: "重大事项决策",
              description: "重大事项的决策程序",
              scope: "公司战略、股权变更、重大投资",
              threshold: 0.67,
              revisedBy: null
            }
          ]
        ],
        terms: [
          {
            id: "company_name",
            title: "公司名称",
            content: "[公司名称]",
            revisedBy: "major_decision"
          }
        ],
        misc: [
          {
            type: "说明性条款",
            content: "公司愿景：[公司愿景描述]",
            addedAt: new Date().toISOString()
          }
        ]
      }
    };
  }

  getHtmlTemplate() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>创业协议</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h3 { color: #7f8c8d; }
        .section { margin-bottom: 30px; }
        .term { margin: 20px 0; padding: 15px; border-left: 4px solid #3498db; background: #f8f9fa; }
    </style>
</head>
<body>
    <h1>创业协议</h1>
    <div class="section">
        <h2>前言</h2>
        <p>协议前言</p>
    </div>
    <div class="section">
        <h2>角色定义</h2>
        <div class="term">
            <h3>创始人</h3>
            <p><strong>描述:</strong> 公司创始人</p>
            <p><strong>职责:</strong> 战略决策、团队建设、外部关系</p>
        </div>
    </div>
    <div class="section">
        <h2>条款内容</h2>
        <div class="term">
            <h3>公司名称</h3>
            <p>[公司名称]</p>
        </div>
    </div>
</body>
</html>`;
  }
}

module.exports = AgreementGenerator;