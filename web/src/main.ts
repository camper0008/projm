import { Board, makeBoard } from "bsm";
import { DragZoner } from "./drag_zoner.ts";
import { Renderer } from "./render.ts";
import { execute } from "bsm";
import { Action } from "bsm";
import { UiEvent } from "./ui_event.ts";
import { DragSession } from "./drag_session.ts";

function handleEvent(board: Board, dragZoner: DragZoner, event: UiEvent) {
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
        case "task_drag_start": {
            new DragSession({
                dragZoner,
                eventHandler: (event: UiEvent) =>
                    handleEvent(board, dragZoner, event),
                subject: {
                    tag: "task",
                    ref: event.ref,
                    initialPosition: event.position,
                    id: event.task,
                },
            });
            break;
        }
        case "task_drag_end": {
            const action: Action = {
                tag: "move_task",
                src: event.task,
                dest: event.position,
            };
            execute({ board, action });
            render(board);
            break;
        }

        case "column_drag_start": {
            new DragSession({
                dragZoner,
                eventHandler: (event: UiEvent) =>
                    handleEvent(board, dragZoner, event),
                subject: {
                    tag: "column",
                    ref: event.ref,
                    initialPosition: event.position,
                    id: event.column,
                },
            });
            break;
        }
        case "column_drag_end": {
            const action: Action = {
                tag: "move_column",
                src: event.column,
                dest: event.position,
            };
            execute({ board, action });
            render(board);
            break;
        }
    }
}

function render(board: Board) {
    const dragZoner = new DragZoner();
    const renderer = new Renderer({
        board,
        dragZoner,
        eventHandler: (event) => handleEvent(board, dragZoner, event),
    });
    const element = document.querySelector<HTMLElement>("#board");
    if (!element) {
        throw new Error("unreachable");
    }
    element.replaceChildren(...renderer.render());
}

function main() {
    const board = makeBoard("cool board");
    render(board);
}

main();
