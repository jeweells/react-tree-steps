import typescript from "rollup-plugin-typescript2";
import commonjs from "rollup-plugin-commonjs";
import external from "rollup-plugin-peer-deps-external";
import resolve from "rollup-plugin-node-resolve";
import {terser} from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy'
import path from "path";
import tscfg from "./tsconfig.json";

export default {
    input: "src/index.ts",
    output: [
        {
            file: path.join(tscfg.compilerOptions.outDir, "index.js"),
            format: "cjs",
            exports: "named",
            compact: true,
            sourcemap: true
        },
        {
            file: path.join(tscfg.compilerOptions.outDir, "index.es.js"),
            format: "es",
            exports: "named",
            compact: true,
            sourcemap: true
        }
    ],
    plugins: [
        external(),
        resolve(),
        typescript({
            rollupCommonJSResolveHack: true,
            exclude: ["**/__tests__/**", "**/tests/**"],
            clean: true,
            tsconfigOverride: {
                compilerOptions: {
                    noEmit: false,
                }
            }
        }),
        commonjs(),
        terser({
            toplevel: true,
        }),
        copy({
            targets: [
                { src: 'package.json', dest: tscfg.compilerOptions.outDir },
            ]
        })
    ],
    external: [
        "react",
        "react-dom",
        "react-router",
        "react-router-dom",
        "uuid"
    ]
};
