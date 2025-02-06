import { DragZoner } from "./drag_zoner.ts";
import { Renderer } from "./render_board.ts";
import { BoardStateConfig, handleUiEvent } from "./ui_event.ts";
import * as storage from "./storage.ts";

export function renderBoardPage(
    board: BoardStateConfig,
    storage: storage.Storage,
) {
    const dragZoner = new DragZoner();
    const renderer = new Renderer({
        board: board.ref,
        dragZoner,
        eventHandler: (event) =>
            handleUiEvent(board, storage, dragZoner, event),
    });
    const element = document.createElement("div");
    element.classList.add("board");
    element.replaceChildren(...renderer.render());
    const container = document.querySelector<HTMLElement>("#content");
    if (!container) {
        throw new Error("unreachable: defined in index.html");
    }
    container.replaceChildren(element);
}
