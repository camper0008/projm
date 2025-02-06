import { Board } from "bsm";
import { DragZoner } from "./drag_zoner.ts";
import { Renderer } from "./render_board.ts";
import { handleUiEvent } from "./ui_event.ts";

export function renderBoardPage(board: Board) {
    const dragZoner = new DragZoner();
    const renderer = new Renderer({
        board,
        dragZoner,
        eventHandler: (event) => handleUiEvent(board, dragZoner, event),
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
