import { Application, Router } from "@oak/oak";
import { oakCors } from "cors";
import { BoardState, Id } from "./board.ts";

function newId() {
    return crypto.randomUUID();
}

type UpdateBoardRequest = {
    id: Id;
    board: BoardState;
    lastUpdate: string;
};

async function main() {
    const boards = [{
        id: newId(),
        updatedAt: new Date().toISOString(),
        state: { title: "Test board", content: [] },
    }];
    const router = new Router();

    router.get("/boards", () => {
        return boards.map(({ id, state }) => ({ id: id, title: state.title }));
    });

    router.post("/update_board", (ctx) => {
        return boards.map(({ id, state }) => ({ id: id, title: state.title }));
    });

    const app = new Application();
    app.use(oakCors());
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.addEventListener(
        "listen",
        ({ port }) =>
            console.log(`Server listening on http://localhost:${port}`),
    );

    await app.listen({ port: 8080 });
}

if (import.meta.main) {
    main();
}
