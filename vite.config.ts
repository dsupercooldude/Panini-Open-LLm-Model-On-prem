import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

function disableHmrWebSocketClientPlugin(): Plugin {
  return {
    name: 'disable-hmr-websocket-client',
    enforce: 'post',
    transform(code, id) {
      if (id.includes('vite/dist/client/client.mjs') || id.includes('vite/dist/client/bundledDevClient.mjs')) {
        return code
          .replace(
            'reject(/* @__PURE__ */ new Error("WebSocket closed without opened."));',
            'resolve();'
          )
          .replace(
            'transport.connect(createHMRHandler(handleMessage));',
            '/* HMR WebSocket disabled in AI Studio */'
          )
          .replace('throw e;', 'return;');
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), disableHmrWebSocketClientPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR and WebSocket server are disabled in AI Studio to prevent WebSocket connection errors and flickering.
      hmr: false,
      ws: false as const,
      watch: null,
    },
  };
});

