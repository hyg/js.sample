class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.config = new Map();
  }

  // 注册插件
  registerPlugin(name, plugin) {
    if (this.plugins.has(name)) {
      throw new Error(`插件 ${name} 已存在`);
    }

    this.plugins.set(name, {
      name,
      plugin,
      enabled: true,
      hooks: new Set(),
      config: plugin.defaultConfig || {}
    });

    // 注册插件的钩子
    if (plugin.hooks) {
      Object.keys(plugin.hooks).forEach(hookName => {
        this.registerHook(hookName, plugin.hooks[hookName], name);
      });
    }

    console.log(`插件 ${name} 已注册`);
  }

  // 卸载插件
  unregisterPlugin(name) {
    if (!this.plugins.has(name)) {
      return false;
    }

    const pluginData = this.plugins.get(name);
    
    // 清理挂钩
    pluginData.hooks.forEach(hookName => {
      this.unregisterHook(hookName, name);
    });

    this.plugins.delete(name);
    console.log(`插件 ${name} 已卸载`);
    return true;
  }

  // 启用/禁用插件
  togglePlugin(name, enabled) {
    if (!this.plugins.has(name)) {
      return false;
    }

    this.plugins.get(name).enabled = enabled;
    console.log(`插件 ${name} ${enabled ? '已启用' : '已禁用'}`);
    return true;
  }

  // 注册钩子
  registerHook(hookName, handler, pluginName) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName).push({
      handler,
      pluginName,
      priority: handler.priority || 100
    });

    // 按优先级排序
    this.hooks.get(hookName).sort((a, b) => a.priority - b.priority);

    if (pluginName) {
      this.plugins.get(pluginName)?.hooks.add(hookName);
    }
  }

  // 执行钩子
  async executeHook(hookName, context = {}, ...args) {
    if (!this.hooks.has(hookName)) {
      return context;
    }

    let result = context;
    const hooks = this.hooks.get(hookName);

    for (const { handler, pluginName } of hooks) {
      const plugin = this.plugins.get(pluginName);
      if (!plugin || !plugin.enabled) continue;

      try {
        if (typeof handler === 'function') {
          result = await handler(result, ...args) || result;
        }
      } catch (error) {
        console.error(`插件 ${pluginName} 的钩子 ${hookName} 执行失败:`, error);
      }
    }

    return result;
  }

  // 获取插件配置
  getPluginConfig(name, key = null) {
    if (!this.plugins.has(name)) {
      return null;
    }

    const plugin = this.plugins.get(name);
    if (key) {
      return plugin.config[key];
    }
    return plugin.config;
  }

  // 设置插件配置
  setPluginConfig(name, key, value) {
    if (!this.plugins.has(name)) {
      return false;
    }

    this.plugins.get(name).config[key] = value;
    return true;
  }

  // 获取所有插件
  getPlugins() {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.name,
      enabled: p.enabled,
      hooks: Array.from(p.hooks),
      config: p.config
    }));
  }

  // 获取可用钩子
  getHooks() {
    return Array.from(this.hooks.keys());
  }
}

module.exports = PluginManager;