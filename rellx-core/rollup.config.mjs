import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
    input: 'src/index.ts',
    output: [
        { 
            file: 'dist/index.js', 
            format: 'esm',
            sourcemap: !isProduction
        },
        { 
            file: 'dist/index.cjs', 
            format: 'cjs',
            sourcemap: !isProduction
        }
    ],
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
            declaration: true,
            declarationDir: 'dist/types',
            sourceMap: !isProduction
        }),
        ...(isProduction ? [terser({
            compress: {
                drop_console: false,
                drop_debugger: true,
                pure_funcs: ['console.debug']
            },
            format: {
                comments: false
            }
        })] : [])
    ],
    treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
    }
});