declare module 'tailwindcss' {
  interface Config {
    content?: string[];
    theme?: Record<string, any>;
    plugins?: any[];
    presets?: any[];
    prefix?: string;
    important?: boolean | string;
    separator?: string;
    safelist?: string[];
    blocklist?: string[];
    corePlugins?: Record<string, boolean>;
  }
  export type { Config };
}
