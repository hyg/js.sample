let globalState = {
    tasks: [],
    allowedPermissions: [],
    forbiddenPermissions: []
  };
  
  const actions = {
    // 任务操作
    addTask_reviewDocuments: () => {
      if (!globalState.tasks.includes('reviewDocuments')) {
        globalState.tasks.push('reviewDocuments');
        console.log('[动作执行] 添加任务: reviewDocuments');
      }
    },
    addTask_prepareReport: () => {
      if (!globalState.tasks.includes('prepareReport')) {
        globalState.tasks.push('prepareReport');
        console.log('[动作执行] 添加任务: prepareReport');
      }
    },
    addTask_approveBudgets: () => {
      if (!globalState.tasks.includes('approveBudgets')) {
        globalState.tasks.push('approveBudgets');
        console.log('[动作执行] 添加任务: approveBudgets');
      }
    },
    clearAllTasks: () => {
      globalState.tasks = [];
      console.log('[动作执行] 清空所有任务');
    },
  
    // 权限操作（确保重复添加无效）
    addPermission_viewDashboard: () => {
      if (!globalState.allowedPermissions.includes('viewDashboard')) {
        globalState.allowedPermissions.push('viewDashboard');
        console.log('[动作执行] 允许职权: viewDashboard');
      }
    },
    addPermission_viewProfile: () => {
      if (!globalState.allowedPermissions.includes('viewProfile')) {
        globalState.allowedPermissions.push('viewProfile');
        console.log('[动作执行] 允许职权: viewProfile');
      }
    },
    addPermission_approveRequests: () => {
      if (!globalState.allowedPermissions.includes('approveRequests')) {
        globalState.allowedPermissions.push('approveRequests');
        console.log('[动作执行] 允许职权: approveRequests');
      }
    },
    addPermission_manageUsers: () => {
      if (!globalState.allowedPermissions.includes('manageUsers')) {
        globalState.allowedPermissions.push('manageUsers');
        console.log('[动作执行] 允许职权: manageUsers');
      }
    },
    addPermission_exportData: () => {
      if (!globalState.allowedPermissions.includes('exportData')) {
        globalState.allowedPermissions.push('exportData');
        console.log('[动作执行] 允许职权: exportData');
      }
    },
    removePermission_approveRequests: () => {
      globalState.allowedPermissions = globalState.allowedPermissions.filter(p => p !== 'approveRequests');
    },
    removePermission_manageUsers: () => {
      globalState.allowedPermissions = globalState.allowedPermissions.filter(p => p !== 'manageUsers');
    },
    clearAllPermissions: () => {
      globalState.allowedPermissions = [];
    },
  
    // 禁止权限操作
    addForbidden_approveRequests: () => {
      if (!globalState.forbiddenPermissions.includes('approveRequests')) {
        globalState.forbiddenPermissions.push('approveRequests');
      }
    },
    addForbidden_manageUsers: () => {
      if (!globalState.forbiddenPermissions.includes('manageUsers')) {
        globalState.forbiddenPermissions.push('manageUsers');
      }
    },
    removeForbidden_approveRequests: () => {
      globalState.forbiddenPermissions = globalState.forbiddenPermissions.filter(p => p !== 'approveRequests');
    },
    removeForbidden_manageUsers: () => {
      globalState.forbiddenPermissions = globalState.forbiddenPermissions.filter(p => p !== 'manageUsers');
    },
    clearAllForbidden: () => {
      globalState.forbiddenPermissions = [];
    }
  };
  
  module.exports = {
    actions,
    getGlobalState: () => JSON.parse(JSON.stringify(globalState)),
    resetState: () => {
      globalState = { tasks: [], allowedPermissions: [], forbiddenPermissions: [] };
    }
  };
  