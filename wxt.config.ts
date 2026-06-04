import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { platform } from 'os';

const heliumBinary = platform() === 'darwin'
  ? '/Applications/Helium.app/Contents/MacOS/Helium'
  : 'C:\\Users\\xiaoj\\AppData\\Local\\imput\\Helium\\Application\\chrome.exe';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  browser: 'chrome',
  runner: {
    chromiumArgs: [],
    binaries: {
      chrome: heliumBinary,
    },
  },
  manifest: {
    name: 'HappyNote',
    description: 'A minimal Typora-like Markdown editor in your browser',
    action: {
      default_title: 'Open HappyNote',
      default_icon: {
        16: '/icon/16.png',
        32: '/icon/32.png',
        48: '/icon/48.png',
        128: '/icon/128.png',
      },
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+N',
        },
        description: 'Open HappyNote',
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
