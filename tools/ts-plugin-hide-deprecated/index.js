/**
 * Hide auto-import completions for symbols marked with `@deprecated`.
 *
 * TypeScript exposes deprecation through `CompletionEntry.kindModifiers`
 * (for example `"export,deprecated"`). There is no tsserver or vtsls setting
 * for filtering those entries, so this plugin removes them for imports while
 * leaving deprecated members in the current scope visible.
 */
function init() {
  /** @param {string | undefined} kindModifiers */
  function isDeprecated(kindModifiers) {
    return kindModifiers?.split(",").includes("deprecated") ?? false;
  }

  /** @param {import("typescript/lib/tsserverlibrary").server.PluginCreateInfo} info */
  function create(info) {
    const proxy = Object.create(null);

    for (const key of Object.keys(info.languageService)) {
      const method = info.languageService[key];
      proxy[key] = (...args) => method.apply(info.languageService, args);
    }

    proxy.getCompletionsAtPosition = (fileName, position, options, ...rest) => {
      const completions = info.languageService.getCompletionsAtPosition(
        fileName,
        position,
        options,
        ...rest,
      );

      if (completions) {
        completions.entries = completions.entries.filter(
          (entry) => !(entry.source && isDeprecated(entry.kindModifiers)),
        );
      }

      return completions;
    };

    return proxy;
  }

  return { create };
}

module.exports = init;
