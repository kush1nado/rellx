import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';

export default defineConfig({
    input: 'src/index.ts',
    output: [
        { file: 'dist/index.js', format: 'esm' },
        { file: 'dist/index.cjs', format: 'cjs' }
    ],
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
            declaration: true,
            declarationDir: 'dist/types'
        })
    ],
    external: ['rellx', 'ws']
});
