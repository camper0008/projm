import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.0";

await esbuild.build({
    plugins: [...denoPlugins()],
    entryPoints: ["./src/main.ts"],
    outfile: "./dist/bundle.js",
    bundle: true,
    format: "esm",
});

esbuild.stop();
