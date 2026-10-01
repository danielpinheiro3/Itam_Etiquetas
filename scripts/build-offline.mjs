import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import fs from 'fs';

async function buildOfflineTemplate() {
  console.log('Generating offline standalone HTML template and portable bundle...');
  const outDir = path.resolve(process.cwd(), 'dist-singlefile');
  
  await build({
    base: './',
    plugins: [react(), tailwindcss(), viteSingleFile()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    build: {
      outDir,
      emptyOutDir: true,
      minify: true,
    }
  });

  const generatedHtmlPath = path.join(outDir, 'index.html');
  if (!fs.existsSync(generatedHtmlPath)) {
    throw new Error('Failed to find generated singlefile index.html');
  }

  let htmlContent = fs.readFileSync(generatedHtmlPath, 'utf8');

  // Verify and sanitize: Ensure NO unescaped </script> tag exists inside the <script> block
  const firstScript = htmlContent.indexOf('<script');
  const lastScript = htmlContent.lastIndexOf('</script>');
  if (firstScript !== -1 && lastScript !== -1) {
    const head = htmlContent.substring(0, firstScript);
    let scriptBody = htmlContent.substring(firstScript, lastScript);
    const tail = htmlContent.substring(lastScript);

    // Find any premature </script> inside scriptBody
    // Replace any occurrence of </script with <\/script (except opening tag)
    const scriptOpenTagEnd = scriptBody.indexOf('>');
    if (scriptOpenTagEnd !== -1) {
      const tag = scriptBody.substring(0, scriptOpenTagEnd + 1);
      let innerCode = scriptBody.substring(scriptOpenTagEnd + 1);
      innerCode = innerCode.replace(/<\/script/gi, '<\\/script');
      scriptBody = tag + innerCode;
    }
    htmlContent = head + scriptBody + tail;
  }

  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Copy standalone template and Sistema_de_Etiquetas.html to public
  const templatePath = path.join(publicDir, 'standalone-template.html');
  const sistemaPath = path.join(publicDir, 'Sistema_de_Etiquetas.html');
  fs.writeFileSync(templatePath, htmlContent, 'utf8');
  fs.writeFileSync(sistemaPath, htmlContent, 'utf8');
  console.log(`Standalone HTML template successfully saved to: ${templatePath}`);

  // 2. Also copy to dist if dist exists
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'standalone-template.html'), htmlContent, 'utf8');
    fs.writeFileSync(path.join(distDir, 'Sistema_de_Etiquetas.html'), htmlContent, 'utf8');
  }

  // 3. Prepare portable-bundle in public for ZIP downloads
  const bundleDir = path.resolve(publicDir, 'portable-bundle');
  if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true });
  }

  if (fs.existsSync(distDir)) {
    const distIndex = path.join(distDir, 'index.html');
    if (fs.existsSync(distIndex)) {
      fs.copyFileSync(distIndex, path.join(bundleDir, 'index.html'));
    }

    const distAssets = path.join(distDir, 'assets');
    const bundleAssets = path.join(bundleDir, 'assets');
    if (fs.existsSync(distAssets)) {
      if (!fs.existsSync(bundleAssets)) fs.mkdirSync(bundleAssets, { recursive: true });
      const assetFiles = fs.readdirSync(distAssets);
      for (const file of assetFiles) {
        fs.copyFileSync(path.join(distAssets, file), path.join(bundleAssets, file));
      }
    }

    // Collect manifest
    const manifest = [];
    function collectFiles(dir, rel = '') {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const full = path.join(dir, item);
        const relative = rel ? `${rel}/${item}` : item;
        if (fs.statSync(full).isDirectory()) {
          collectFiles(full, relative);
        } else {
          manifest.push(relative);
        }
      }
    }
    collectFiles(bundleDir);
    fs.writeFileSync(path.join(publicDir, 'portable-manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(`Portable bundle created with ${manifest.length} files.`);
  }
}

buildOfflineTemplate().catch(err => {
  console.error('Error building offline template:', err);
  process.exit(1);
});
