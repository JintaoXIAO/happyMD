import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  browser: 'chrome',
  runner: {
    chromiumArgs: [],
    binaries: {
      chrome: 'C:\\Users\\xiaoj\\AppData\\Local\\imput\\Helium\\Application\\chrome.exe',
    },
  },
  manifest: {
    name: 'HappyNote',
    description: 'A minimal Typora-like Markdown editor in your browser',
    version: '0.1.0',
    action: {
      default_title: 'Open HappyNote',
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
