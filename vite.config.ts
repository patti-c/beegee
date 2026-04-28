import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function inkPlugin(): Plugin {
  return {
    name: 'vite-plugin-ink',
    async transform(src, id) {
      if (!id.endsWith('.ink')) return;
      const { Compiler } = await import('inkjs/compiler/Compiler');
      const inkDir = path.dirname(id);

      // Register included files so Vite recompiles on changes to them.
      const includeRe = /^INCLUDE\s+(.+)/gm;
      let m;
      while ((m = includeRe.exec(src)) !== null) {
        this.addWatchFile(path.resolve(inkDir, m[1].trim()));
      }

      // Cast to any: CompilerOptions requires all fields but fileHandler is the only one we need.
      const story = new Compiler(src, {
        fileHandler: {
          ResolveInkFilename: (filename: string) => path.resolve(inkDir, filename),
          LoadInkFileContents: (filename: string) => readFileSync(filename, 'utf-8'),
        },
      } as any).Compile();

      return { code: `export default ${story.ToJson()}`, map: null };
    },
  };
}

export default defineConfig({
  plugins: [react(), inkPlugin()],
});
