const loadedScripts = new Set();

const resolveSource = (source) => {
  if (!source) {
    throw new Error('loadLegacyScripts: missing script source path');
  }
  if (/^https?:\/\//i.test(source)) {
    return source;
  }
  return new URL(source, document.baseURI).href;
};

const appendScript = (scriptConfig, parentNode) => {
  const config = typeof scriptConfig === 'string' ? { src: scriptConfig } : scriptConfig;
  if (!config || !config.src) {
    return;
  }

  const resolvedSrc = resolveSource(config.src);
  if (loadedScripts.has(resolvedSrc)) {
    return;
  }

  const script = document.createElement('script');
  script.src = resolvedSrc;
  if (config.defer !== false) {
    script.defer = true;
  }
  if (config.async) {
    script.async = true;
  }
  if (config.integrity) {
    script.integrity = config.integrity;
  }
  if (config.crossOrigin) {
    script.crossOrigin = config.crossOrigin;
  }
  if (config.referrerPolicy) {
    script.referrerPolicy = config.referrerPolicy;
  }
  if (config.dataset) {
    Object.entries(config.dataset).forEach(([key, value]) => {
      if (value !== undefined) {
        script.dataset[key] = String(value);
      }
    });
  }

  (parentNode ?? document.head ?? document.body).appendChild(script);
  loadedScripts.add(resolvedSrc);
};

/**
 * Inject classic script tags dynamically so Vite ignores them during the build.
 * @param {Array<string | {src: string, defer?: boolean, async?: boolean}>} scripts
 * @param {{ parent?: HTMLElement }} [options]
 */
export function loadLegacyScripts(scripts, options = {}) {
  if (!Array.isArray(scripts) || scripts.length === 0) {
    return;
  }

  const parentNode = options.parent ?? document.head ?? document.body;
  scripts.forEach((script) => appendScript(script, parentNode));
}

export function resetLoadedLegacyScripts() {
  loadedScripts.clear();
}
