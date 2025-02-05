import * as bsm from "bsm";
import { DragZone } from "./drag_zone.ts";
import { UiEvent } from "./models.ts";
import { Renderer } from "./render.ts";

function handleEvent(board: bsm.Board, event: UiEvent) {}

function main() {
    const element = document.querySelector<HTMLElement>("#board");
    if (!element) {
        throw new Error("unreachable");
    }
    const board = bsm.new_board("cool board");
    const dragZone = new DragZone();

    const renderer = new Renderer({
        dragZone,
        eventHandler: (event) => handleEvent(board, event),
    });

    renderer.render(board);
}

main();
