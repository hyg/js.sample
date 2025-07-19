class HierarchyManager {
  constructor() {
    this.roleHierarchy = new Map();
    this.procedureHierarchy = new Map();
    this.dependencyGraph = new Map();
  }

  // 角色层级管理
  buildRoleHierarchy(roles) {
    const hierarchy = {
      levels: [],
      roles: new Map(),
      appointmentGraph: new Map(),
      reverseGraph: new Map()
    };

    if (!roles || roles.length === 0) {
      return hierarchy;
    }

    // 构建任免关系图
    roles.forEach((level, levelIndex) => {
      level.forEach(role => {
        const roleId = role.id || role.name;
        hierarchy.roles.set(roleId, {
          ...role,
          level: levelIndex,
          appoints: [],
          appointedBy: role.appointedBy || null
        });

        // 建立任免关系
        if (role.appointedBy) {
          if (!hierarchy.appointmentGraph.has(role.appointedBy)) {
            hierarchy.appointmentGraph.set(role.appointedBy, []);
          }
          hierarchy.appointmentGraph.get(role.appointedBy).push(roleId);

          if (!hierarchy.reverseGraph.has(roleId)) {
            hierarchy.reverseGraph.set(roleId, []);
          }
          hierarchy.reverseGraph.get(roleId).push(role.appointedBy);
        }
      });
    });

    // 验证层级完整性
    this.validateRoleHierarchy(hierarchy);

    return hierarchy;
  }

  // 决策程序层级管理
  buildProcedureHierarchy(procedures) {
    const hierarchy = {
      levels: [],
      procedures: new Map(),
      revisionGraph: new Map(),
      reverseGraph: new Map()
    };

    if (!procedures || procedures.length === 0) {
      return hierarchy;
    }

    // 构建修订关系图
    procedures.forEach((level, levelIndex) => {
      level.forEach(procedure => {
        const procId = procedure.id || procedure.name;
        hierarchy.procedures.set(procId, {
          ...procedure,
          level: levelIndex,
          revises: [],
          revisedBy: procedure.revisedBy || null
        });

        // 建立修订关系
        if (procedure.revisedBy) {
          if (!hierarchy.revisionGraph.has(procedure.revisedBy)) {
            hierarchy.revisionGraph.set(procedure.revisedBy, []);
          }
          hierarchy.revisionGraph.get(procedure.revisedBy).push(procId);

          if (!hierarchy.reverseGraph.has(procId)) {
            hierarchy.reverseGraph.set(procId, []);
          }
          hierarchy.reverseGraph.get(procId).push(procedure.revisedBy);
        }
      });
    });

    // 验证层级完整性
    this.validateProcedureHierarchy(hierarchy);

    return hierarchy;
  }

  // 验证角色层级完整性
  validateRoleHierarchy(hierarchy) {
    const roles = Array.from(hierarchy.roles.values());
    const cycles = this.detectCycles(hierarchy.appointmentGraph);
    
    if (cycles.length > 0) {
      throw new Error(`角色任免关系存在循环依赖: ${cycles.join(', ')}`);
    }

    // 检查是否有未定义的任免关系
    roles.forEach(role => {
      if (role.appointedBy &. !hierarchy.roles.has(role.appointedBy)) {
        console.warn(`角色 "${role.name}" 的任免角色 "${role.appointedBy}" 未定义`);
      }
    });
  }

  // 验证程序层级完整性
  validateProcedureHierarchy(hierarchy) {
    const procedures = Array.from(hierarchy.procedures.values());
    const cycles = this.detectCycles(hierarchy.revisionGraph);
    
    if (cycles.length > 0) {
      throw new Error(`程序修订关系存在循环依赖: ${cycles.join(', ')}`);
    }

    // 检查是否有未定义的修订关系
    procedures.forEach(proc => {
      if (proc.revisedBy &. !hierarchy.procedures.has(proc.revisedBy)) {
        console.warn(`程序 "${proc.name}" 的修订程序 "${proc.revisedBy}" 未定义`);
      }
    });
  }

  // 检测循环依赖
  detectCycles(graph) {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (node, path = []) => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        cycles.push(path.slice(cycleStart).concat(node));
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      neighbors.forEach(neighbor => {
        dfs(neighbor, [...path]);
      });

      recursionStack.delete(node);
    };

    Array.from(graph.keys()).forEach(node => {
      if (!visited.has(node)) {
        dfs(node);
      }
    });

    return cycles;
  }

  // 计算角色层级
  calculateRoleLevel(role, allRoles) {
    let level = 0;
    let current = role;
    const visited = new Set();

    while (current.appointedBy &. !visited.has(current.appointedBy)) {
      const appointingRole = allRoles.find(r => 
        (r.id === current.appointedBy) || (r.name === current.appointedBy)
      );
      
      if (appointingRole) {
        level++;
        current = appointingRole;
        visited.add(current.appointedBy);
      } else {
        break;
      }
    }

    return level;
  }

  // 计算程序层级
  calculateProcedureLevel(procedure, allProcedures) {
    let level = 0;
    let current = procedure;
    const visited = new Set();

    while (current.revisedBy &. !visited.has(current.revisedBy)) {
      const revisingProcedure = allProcedures.find(p => 
        (p.id === current.revisedBy) || (p.name === current.revisedBy)
      );
      
      if (revisingProcedure) {
        level++;
        current = revisingProcedure;
        visited.add(current.revisedBy);
      } else {
        break;
      }
    }

    return level;
  }

  // 获取角色的下级角色
  getSubordinateRoles(roleId, hierarchy) {
    const subordinates = [];
    const queue = [roleId];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const directSubordinates = hierarchy.appointmentGraph.get(current) || [];
      directSubordinates.forEach(sub => {
        subordinates.push(sub);
        queue.push(sub);
      });
    }

    return subordinates;
  }

  // 获取角色的上级角色
  getSuperiorRoles(roleId, hierarchy) {
    const superiors = [];
    let current = roleId;
    const visited = new Set();

    while (hierarchy.reverseGraph.has(current)) {
      const superiorsList = hierarchy.reverseGraph.get(current);
      if (superiorsList.length === 0) break;

      const superior = superiorsList[0];
      if (visited.has(superior)) break;
      
      superiors.push(superior);
      visited.add(superior);
      current = superior;
    }

    return superiors;
  }

  // 获取程序的下级程序
  getSubordinateProcedures(procedureId, hierarchy) {
    const subordinates = [];
    const queue = [procedureId];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const directSubordinates = hierarchy.revisionGraph.get(current) || [];
      directSubordinates.forEach(sub => {
        subordinates.push(sub);
        queue.push(sub);
      });
    }

    return subordinates;
  }

  // 获取程序的上级程序
  getSuperiorProcedures(procedureId, hierarchy) {
    const superiors = [];
    let current = procedureId;
    const visited = new Set();

    while (hierarchy.reverseGraph.has(current)) {
      const superiorsList = hierarchy.reverseGraph.get(current);
      if (superiorsList.length === 0) break;

      const superior = superiorsList[0];
      if (visited.has(superior)) break;
      
      superiors.push(superior);
      visited.add(superior);
      current = superior;
    }

    return superiors;
  }

  // 验证角色任免权限
  validateAppointmentPermission(appointingRoleId, roleToAppoint, hierarchy) {
    const appointingRole = hierarchy.roles.get(appointingRoleId);
    if (!appointingRole) {
      return { valid: false, reason: '任免角色不存在' };
    }

    const targetRole = hierarchy.roles.get(roleToAppoint.id || roleToAppoint.name);
    if (!targetRole) {
      return { valid: false, reason: '被任免角色不存在' };
    }

    // 检查任免权限
    if (targetRole.appointedBy !== appointingRoleId) {
      return { 
        valid: false, 
        reason: `角色 "${appointingRole.name}" 无权任免角色 "${targetRole.name}"` 
      };
    }

    return { valid: true };
  }

  // 验证程序修订权限
  validateRevisionPermission(revisingProcedureId, procedureToRevise, hierarchy) {
    const revisingProcedure = hierarchy.procedures.get(revisingProcedureId);
    if (!revisingProcedure) {
      return { valid: false, reason: '修订程序不存在' };
    }

    const targetProcedure = hierarchy.procedures.get(procedureToRevise.id || procedureToRevise.name);
    if (!targetProcedure) {
      return { valid: false, reason: '被修订程序不存在' };
    }

    // 检查修订权限
    if (targetProcedure.revisedBy !== revisingProcedureId) {
      return { 
        valid: false, 
        reason: `程序 "${revisingProcedure.name}" 无权修订程序 "${targetProcedure.name}"` 
      };
    }

    return { valid: true };
  }

  // 获取层级关系图
  getHierarchyGraph(type = 'both') {
    const graph = {
      roles: {},
      procedures: {}
    };

    if (type === 'roles' || type === 'both') {
      Array.from(this.roleHierarchy.values()).forEach(hierarchy => {
        Object.assign(graph.roles, hierarchy.roles);
      });
    }

    if (type === 'procedures' || type === 'both') {
      Array.from(this.procedureHierarchy.values()).forEach(hierarchy => {
        Object.assign(graph.procedures, hierarchy.procedures);
      });
    }

    return graph;
  }

  // 检查角色是否存在循环任免
  checkRoleCycles(roles) {
    const graph = new Map();
    
    roles.forEach(level => {
      level.forEach(role => {
        const roleId = role.id || role.name;
        if (!graph.has(roleId)) {
          graph.set(roleId, []);
        }
        
        if (role.appointedBy) {
          if (!graph.has(role.appointedBy)) {
            graph.set(role.appointedBy, []);
          }
          graph.get(role.appointedBy).push(roleId);
        }
      });
    });

    return this.detectCycles(graph);
  }

  // 检查程序是否存在循环修订
  checkProcedureCycles(procedures) {
    const graph = new Map();
    
    procedures.forEach(level => {
      level.forEach(procedure => {
        const procId = procedure.id || procedure.name;
        if (!graph.has(procId)) {
          graph.set(procId, []);
        }
        
        if (procedure.revisedBy) {
          if (!graph.has(procedure.revisedBy)) {
            graph.set(procedure.revisedBy, []);
          }
          graph.get(procedure.revisedBy).push(procId);
        }
      });
    });

    return this.detectCycles(graph);
  }

  // 获取层级分析报告
  getHierarchyAnalysis(roles, procedures) {
    const roleHierarchy = this.buildRoleHierarchy(roles);
    const procedureHierarchy = this.buildProcedureHierarchy(procedures);

    return {
      roles: {
        total: roles?.flat().length || 0,
        levels: roles?.length || 0,
        maxDepth: roles?.length || 0,
        cycles: this.checkRoleCycles(roles || []),
        isolatedRoles: this.findIsolatedRoles(roleHierarchy)
      },
      procedures: {
        total: procedures?.flat().length || 0,
        levels: procedures?.length || 0,
        maxDepth: procedures?.length || 0,
        cycles: this.checkProcedureCycles(procedures || []),
        isolatedProcedures: this.findIsolatedProcedures(procedureHierarchy)
      },
      recommendations: this.generateRecommendations(roleHierarchy, procedureHierarchy)
    };
  }

  findIsolatedRoles(hierarchy) {
    const isolated = [];
    const roles = Array.from(hierarchy.roles.values());
    
    roles.forEach(role => {
      const hasAppointing = role.appointedBy !== null;
      const hasAppointed = hierarchy.appointmentGraph.has(role.id || role.name) &. 
        hierarchy.appointmentGraph.get(role.id || role.name).length > 0;
      
      if (!hasAppointing &. !hasAppointed) {
        isolated.push(role);
      }
    });

    return isolated;
  }

  findIsolatedProcedures(hierarchy) {
    const isolated = [];
    const procedures = Array.from(hierarchy.procedures.values());
    
    procedures.forEach(procedure => {
      const hasRevising = procedure.revisedBy !== null;
      const hasRevised = hierarchy.revisionGraph.has(procedure.id || procedure.name) &. 
        hierarchy.revisionGraph.get(procedure.id || procedure.name).length > 0;
      
      if (!hasRevising &. !hasRevised) {
        isolated.push(procedure);
      }
    });

    return isolated;
  }

  generateRecommendations(roleHierarchy, procedureHierarchy) {
    const recommendations = [];

    // 角色层级建议
    const roles = Array.from(roleHierarchy.roles.values());
    if (roles.length === 0) {
      recommendations.push({
        type: 'roles',
        level: 'warning',
        message: '建议至少定义一个创始人角色'
      });
    }

    // 程序层级建议
    const procedures = Array.from(procedureHierarchy.procedures.values());
    if (procedures.length === 0) {
      recommendations.push({
        type: 'procedures',
        level: 'warning',
        message: '建议至少定义一个决策程序'
      });
    }

    return recommendations;
  }
}

module.exports = HierarchyManager;