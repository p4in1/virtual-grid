import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import {terser} from "rollup-plugin-terser";
import scss from 'rollup-plugin-scss'
import dts from "rollup-plugin-dts";

export default [{
    input: 'my-grid/src/virtual-grid/styles/virtual.grid.scss', // our source file
    plugins: [
        scss({
            output: './dist/virtual.grid.min.css'
        })
    ],
}, {
    input: 'my-grid/src/virtual-grid/virtual.grid.service.ts',
    output: [
        {
            file: pkg.module,
            format: 'es',
        },
    ],
    external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
    ], plugins: [
        typescript({
            useTsconfigDeclarationDir: true,
            typescript: require('typescript'),
        }),
        terser({
            keep_classnames: true,
            compress: true,
            mangle: true
        })
    ],
}, {
    input: "./declarations/virtual.grid.service.d.ts",
    output: [{file: "dist/virtual.grid.d.ts", format: "es"}],
    plugins: [dts()],
}]