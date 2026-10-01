import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

async function run() {
  await build({
    plugins: [react(), tailwindcss(), viteSingleFile()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    build: {
      outDir: 'dist-singlefile',
      emptyOutDir: true,
    }
  });
  console.log('Singlefile build finished!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
