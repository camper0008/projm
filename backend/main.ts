import { Application, Router } from "@oak/oak";
import { oakCors } from "cors";
import { MemDb } from "./mem_db.ts";
import { BoardData, BoardPreview, Db, Id } from "./db.ts";
import { err, Result } from "@result/result";
import * as bsm from "bsm";

type CreateBoardRequest = {
    title: string;
};

type DeleteBoardRequest = {
    board: Id;
};

type BoardRequest = {
    board: Id;
};

type ExecuteActionRequest = {
    board: Id;
    hash: string;
    action: bsm.Action;
};

function createBoard(
    db: Db,
    req: CreateBoardRequest,
): Result<BoardPreview, string> {
    return db.createBoard(req.title);
}

function boards(
    db: Db,
): Result<BoardPreview[], string> {
    return db.boards();
}

function deleteBoard(
    db: Db,
    req: DeleteBoardRequest,
): Result<void, string> {
    return db.deleteBoard(req.board);
}

function board(
    db: Db,
    req: BoardRequest,
): Result<BoardData, string> {
    return db.retrieveBoardData(req.board);
}

async function executeAction(
    db: Db,
    req: ExecuteActionRequest,
): Promise<Result<void, string>> {
    const { isBreak, value: board } = db.retrieveBoardData(req.board).branch();
    if (isBreak) return board;

    const newHash = await bsm.hashBoard(board.initialTitle, [
        ...board.actions,
        req.action,
    ]);

    if (newHash !== req.hash) {
        return err("invalid hash");
    }

    return db.commitAction(req.board, req.action);
}

async function main() {
    const router = new Router();

    const db: Db = new MemDb();

    const app = new Application();
    router.post("/create_board", async (ctx) => {
        const req: CreateBoardRequest = await ctx.request.body
            .json();
        if (!req.title) {
            ctx.response.body = { ok: false, message: "invalid request body" };
            return;
        }

        const res = (createBoard(db, req)).match(
            (board) => ({ ok: true, message: "success", board }),
            (err) => ({ ok: false, message: err }),
        );
        ctx.response.body = res;
    });

    router.post("/boards", (ctx) => {
        const res = (boards(db)).match(
            (boards) => ({ ok: true, message: "success", boards }),
            (err) => ({ ok: false, message: err }),
        );
        ctx.response.body = res;
    });

    router.post("/board", async (ctx) => {
        const req: BoardRequest = await ctx.request.body
            .json();
        if (!req.board) {
            ctx.response.body = { ok: false, message: "invalid request body" };
            return;
        }

        const res = (board(db, req)).match(
            (board) => ({ ok: true, message: "success", board }),
            (err) => ({ ok: false, message: err }),
        );
        ctx.response.body = res;
    });

    router.post("/execute_action", async (ctx) => {
        const req: ExecuteActionRequest = await ctx.request.body
            .json();
        if (!req.board || !req.action) {
            ctx.response.body = { ok: false, message: "invalid request body" };
            return;
        }

        const res = (await executeAction(db, req)).match(
            (_ok) => ({ ok: true, message: "success" }),
            (err) => ({ ok: false, message: err }),
        );
        ctx.response.body = res;
    });

    router.post("/delete_board", async (ctx) => {
        const req: DeleteBoardRequest = await ctx.request.body
            .json();
        if (!req.board) {
            ctx.response.body = { ok: false, message: "invalid request body" };
            return;
        }

        const res = (deleteBoard(db, req)).match(
            (_ok) => ({ ok: true, message: "success" }),
            (err) => ({ ok: false, message: err }),
        );
        ctx.response.body = res;
    });
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
