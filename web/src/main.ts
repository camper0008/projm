import * as bsm from "bsm";
import { renderBoardPage } from "./render_board_page.ts";
import { Storage } from "./storage.ts";
import { LocalStorage } from "./local_storage.ts";
import { renderBoardsPage } from "./render_boards_page.ts";
import { BackendStorage } from "./backend_storage.ts";

function renderError(message: string) {
    const container = document.querySelector<HTMLElement>("#content");
    if (!container) {
        throw new Error("unreachable: defined in index.html");
    }
    container.innerText = `an error occurred: ${message}`;
}

async function localStorageSolution() {
    const storage: Storage = new BackendStorage("http://localhost:8080");
    const params = new URLSearchParams(location.search);
    const maybeBoard = params.get("board");
    if (maybeBoard) {
        const res = await storage.board({ board: { inner: maybeBoard } });
        if (!res.ok) {
            return renderError(res.message);
        }
        const board = bsm.makeBoard(res.board.initialTitle);
        for (const action of res.board.actions) {
            bsm.execute({ board, action });
        }
        renderBoardPage({
            info: {
                id: res.board.id,
                initialTitle: res.board.initialTitle,
            },
            ref: board,
            history: res.board.actions,
        }, storage);
    } else {
        const res = await storage.boards();
        if (!res.ok) {
            return renderError(res.message);
        }
        return renderBoardsPage(res.boards, storage);
    }
}

async function main() {
    await localStorageSolution();
}

main();
