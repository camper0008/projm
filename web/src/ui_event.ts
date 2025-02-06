import { Action, Board, ColumnPosition, execute, Id, TaskPosition } from "bsm";
import { DragZoner } from "./drag_zoner.ts";
import { renderBoardPage } from "./render_board_page.ts";
import { DragSession } from "./drag_session.ts";

export type UiEvent =
    | { tag: "add_column" }
    | { tag: "add_task"; parent: Id }
    | { tag: "edit_board"; oldTitle: string }
    | { tag: "edit_column"; target: Id; oldTitle: string }
    | { tag: "edit_task"; target: Id; oldContent: string }
    | { tag: "remove_board" }
    | { tag: "remove_column"; target: Id }
    | { tag: "remove_task"; target: Id }
    | {
        tag: "task_drag_start";
        task: Id;
        ref: HTMLElement;
        position: [number, number];
    }
    | {
        tag: "task_drag_end";
        task: Id;
        position: TaskPosition;
    }
    | {
        tag: "column_drag_start";
        column: Id;
        ref: HTMLElement;
        position: [number, number];
    }
    | {
        tag: "column_drag_end";
        column: Id;
        position: ColumnPosition;
    };

export type UiEventHandler = (event: UiEvent) => void;

export function handleUiEvent(
    board: Board,
    dragZoner: DragZoner,
    event: UiEvent,
) {
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
                renderBoardPage(board);
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
                renderBoardPage(board);
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
                renderBoardPage(board);
                break;
            }
            case "remove_task": {
                const action: Action = {
                    tag: "remove_task",
                    target: event.target,
                };
                execute({ board, action });
                renderBoardPage(board);
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
                renderBoardPage(board);
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
                renderBoardPage(board);
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
                renderBoardPage(board);
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
                renderBoardPage(board);
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
                renderBoardPage(board);
                break;
            }
        }
    }

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
            renderBoardPage(board);
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
            renderBoardPage(board);
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
            renderBoardPage(board);
            break;
        }
        case "remove_task": {
            const action: Action = {
                tag: "remove_task",
                target: event.target,
            };
            execute({ board, action });
            renderBoardPage(board);
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
            renderBoardPage(board);
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
            renderBoardPage(board);
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
            renderBoardPage(board);
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
            renderBoardPage(board);
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
            renderBoardPage(board);
            break;
        }
    }
}
