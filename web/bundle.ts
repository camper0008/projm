import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.0";

async function buildCode() {
    await esbuild.build({
        plugins: [...denoPlugins()],
        entryPoints: ["./src/main.ts"],
        outfile: "./dist/bundle.js",
        bundle: true,
        format: "esm",
    });

    esbuild.stop();
}

async function copyStatic(path: string[] = []) {
    const dir = path.join("/");
    await Deno.mkdir("dist/" + dir).catch((_) => _);
    for await (const file of Deno.readDir(`static/${dir}`)) {
        if (file.isDirectory) {
            await copyStatic([...path, file.name]);
            continue;
        }
        await Deno.copyFile(
            `static/${dir}/${file.name}`,
            `dist/${dir}/${file.name}`,
        );
    }
}

type BundleOptions = {
    quiet?: boolean;
};

export async function bundle(options?: BundleOptions) {
    if (!options?.quiet) {
        console.log("info: copying static files");
    }
    await copyStatic();
    if (!options?.quiet) {
        console.log("info: building code");
    }
    await buildCode();
    if (!options?.quiet) {
        console.log("success: output in 'dist/'");
    }
}

if (import.meta.main) {
    await bundle();
}
