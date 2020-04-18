import resolve from '@rollup/plugin-node-resolve';
import replace from './replace';
import babel from 'rollup-plugin-babel';
import { terser } from "rollup-plugin-terser";
import pkg from './package.json'

const extensions = [
    '.js', '.jsx', '.ts', '.tsx',
];


//process.env.NODE_ENV
export default {
    input: './index.ts',
    external: ['react', 'yup'],
    plugins: [
        resolve({ extensions }),
        babel({ extensions, include:['src/**/*'] }),
    ],
    output: [{
        file: `./dist/${pkg.name}.csj.development.js`,
        format: 'cjs',
        plugins: [
            replace({ 'process.env.NODE_ENV': '"development"' }),
        ]
    }, {
        file: `./dist/${pkg.name}.csj.production.min.js`,
        format: 'cjs',
        plugins: [
            replace({ 'process.env.NODE_ENV': '"production"' }),
            terser()
        ]
    }, {
        file: `./dist/${pkg.name}.es.js`,
        format: 'es',
    }, {
        file: `./dist/${pkg.name}.es.prduction.min.js`,
        format: 'es',
        plugins: [
            replace({ 'process.env.NODE_ENV': '"production"' }),
            terser(),
        ],
    }, {
        file: `./dist/${pkg.name}.umd.development.min.js`,
        format: 'umd',
        name: pkg.name,
        plugins: [
            replace({ 'process.env.NODE_ENV': '"development"' }),
        ],
        globals: {
            'react': 'React',
            'yup': 'yup'
        }
    }, {
        file: `./dist/${pkg.name}.umd.production.min.js`,
        format: 'umd',
        name: pkg.name,
        plugins: [
            replace({ 'process.env.NODE_ENV': '"production"' }),
            terser()
        ],
        globals: {
            'react': 'React',
            'yup': 'yup'
        }
    }],

};