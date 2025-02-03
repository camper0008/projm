import { Application, Router } from "@oak/oak";

async function main() {
    const router = new Router();

    router.get("/", (ctx) => {
        ctx.response.body = "";
    });

    const app = new Application();
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.addEventListener(
        "listen",
        ({ port }) =>
            console.log(`Server listening on http://localhost:${port}`),
    );

    await app.listen();
}

if (import.meta.main) {
    main();
}
