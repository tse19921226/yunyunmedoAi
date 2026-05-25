export default class MiddlewarePipeline {
  constructor() {
    this.middlewares = new Map();
  }

  use(hookName, name, handler) {
    if (!this.middlewares.has(hookName)) {
      this.middlewares.set(hookName, []);
    }
    this.middlewares.get(hookName).push({ name, handler });
  }

  async execute(hookName, initialContext) {
    const middlewares = this.middlewares.get(hookName) ?? [];
    const context = {
      hookName,
      isHalted: false,
      haltReason: null,
      data: {},
      ...initialContext,
    };

    let index = -1;
    const next = async () => {
      index += 1;
      const current = middlewares[index];
      if (!current || context.isHalted) return;

      try {
        await current.handler(context, next);
      } catch (error) {
        context.isHalted = true;
        context.haltReason = `${current.name}: ${error.message}`;
      }
    };

    await next();
    return context;
  }
}
