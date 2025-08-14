function nowIso() { return new Date().toISOString(); }

export function createLogger(options = {}) {
  const { quiet = false, verbose = false } = options;

  const log = (...args) => { if (!quiet) console.log(`[${nowIso()}]`, ...args); };
  const v = (...args) => { if (verbose && !quiet) console.log(`[${nowIso()}]`, ...args); };
  const error = (...args) => console.error(`[${nowIso()}]`, ...args);

  return { log, verbose: v, error };
}



