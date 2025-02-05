import { Board, makeBoard } from "bsm";
import { DragZone } from "./drag_zone.ts";
import { Renderer } from "./render.ts";
import { execute } from "bsm";
import { Action } from "bsm";
import { UiEvent } from "./ui_event.ts";

function handleEvent(board: Board, event: UiEvent) {
    switch (event.tag) {
        case "add_column": {
            const title = prompt("Title of column?");
            if (!title) {
                break;
            }
            const action: Action = {
                tag: "add_column",
                title,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "add_task": {
            const content = prompt("Content of task?");
            if (!content) {
                break;
            }
            const action: Action = {
                tag: "add_task",
                content,
                parent: event.parent,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "remove_board": {
            break;
        }
        case "remove_column": {
            const action: Action = {
                tag: "remove_column",
                target: event.target,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "remove_task": {
            const action: Action = {
                tag: "remove_task",
                target: event.target,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "edit_board": {
            const title = prompt("New title?", event.oldTitle);
            if (!title) {
                break;
            }
            const action: Action = {
                tag: "edit_board",
                title,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "edit_column": {
            const title = prompt("New title?", event.oldTitle);
            if (!title) {
                break;
            }
            const action: Action = {
                tag: "edit_column",
                title,
                target: event.target,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "edit_task": {
            const content = prompt("New content?", event.oldContent);
            if (!content) {
                break;
            }
            const action: Action = {
                tag: "edit_task",
                content,
                target: event.target,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "drag_start": {
            break;
        }
    }
}

function render(board: Board) {
    const dragZone = new DragZone();
    const renderer = new Renderer({
        dragZone,
        eventHandler: (event) => handleEvent(board, event),
    });
    const element = document.querySelector<HTMLElement>("#board");
    if (!element) {
        throw new Error("unreachable");
    }
    element.replaceChildren(...renderer.render_content(board));
}

function main() {
    const board = makeBoard("cool board");
    render(board);
}

main();
