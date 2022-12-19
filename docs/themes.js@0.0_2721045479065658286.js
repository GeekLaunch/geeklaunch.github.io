(() => {
  // src/index.ts
  var MEDIA = "(prefers-color-scheme: dark)";
  var getSystemTheme = (e) => {
    if (!e)
      e = window.matchMedia(MEDIA);
    const isDark = e.matches;
    const systemTheme = isDark ? "dark" : "light";
    return systemTheme;
  };
  var Themes = class {
    constructor(config) {
      this._theme = null;
      this._sync = false;
      this.documentTheme = "";
      this.storageKey = "theme";
      if (typeof config === "string") {
        this.theme = config || null;
      } else {
        this.theme = (config == null ? void 0 : config.theme) || null;
        this.storageKey = (config == null ? void 0 : config.storageKey) || this.storageKey;
        this.sync = (config == null ? void 0 : config.sync) || false;
      }
    }
    loadTheme() {
      try {
        return localStorage.getItem(this.storageKey);
      } catch (e) {
      }
      return null;
    }
    observeStorage() {
      if (this.removeStorageListenerFunc !== void 0)
        return;
      const handler = (e) => {
        if (e.key !== this.storageKey) {
          return;
        }
        this.setTheme(e.newValue);
      };
      window.addEventListener("storage", handler);
      this.removeStorageListenerFunc = () => {
        window.removeEventListener("storage", handler);
      };
      this.setTheme(this.loadTheme());
    }
    observe() {
      if (this.removeMediaListenerFunc !== void 0)
        return;
      const media = window.matchMedia(MEDIA);
      const handler = this.handleMediaQuery.bind(this);
      try {
        media.addEventListener("change", handler);
        this.removeMediaListenerFunc = () => {
          media.removeEventListener("change", handler);
        };
      } catch (e1) {
        try {
          media.addListener(handler);
          this.removeMediaListenerFunc = () => {
            media.removeListener(handler);
          };
        } catch (e2) {
          console.error(e2);
        }
      }
      this.handleMediaQuery(media);
    }
    handleMediaQuery(e) {
      const theme = getSystemTheme(e);
      this.applyTheme(theme);
    }
    applyTheme(theme) {
      if (theme !== this.documentTheme) {
        const e = document.documentElement;
        if (e.classList.contains(this.documentTheme)) {
          e.classList.remove(this.documentTheme);
        }
        e.classList.add(theme);
        this.documentTheme = theme;
      }
      if (this.onChange) {
        this.onChange(theme);
      }
    }
    setTheme(theme) {
      this._theme = theme;
      if (!theme || theme === "auto") {
        this.observe();
      } else {
        if (this.removeMediaListenerFunc !== void 0) {
          this.removeMediaListenerFunc();
          delete this.removeMediaListenerFunc;
        }
        this.applyTheme(theme);
      }
    }
    get theme() {
      return this._theme;
    }
    set theme(theme) {
      this._theme = theme;
      this.sync = !theme;
      this.setTheme(theme);
    }
    get sync() {
      return this._sync;
    }
    set sync(sync) {
      if (this._sync === sync)
        return;
      this._sync = sync;
      if (sync) {
        this.observeStorage();
      } else {
        if (this.removeStorageListenerFunc) {
          this.removeStorageListenerFunc();
          delete this.removeStorageListenerFunc;
        }
      }
    }
    commit(sync = true) {
      try {
        if (this.theme) {
          localStorage.setItem(this.storageKey, this.theme);
        } else {
          localStorage.removeItem(this.storageKey);
        }
      } catch (e) {
      }
      this.sync = sync;
    }
  };
  if (typeof window !== "undefined") {
    window.Themes = Themes;
  }
  var src_default = Themes;
})();
