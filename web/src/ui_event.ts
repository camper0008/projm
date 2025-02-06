import * as bsm from "bsm";
import { DragZoner } from "./drag_zoner.ts";
import { DragSession } from "./drag_session.ts";
import * as storage from "./storage.ts";
import { renderBoardPage } from "./render_board_page.ts";

export type UiEvent =
    | { tag: "add_column" }
    | { tag: "add_task"; parent: bsm.Id }
    | { tag: "edit_board"; oldTitle: string }
    | { tag: "edit_column"; target: bsm.Id; oldTitle: string }
    | { tag: "edit_task"; target: bsm.Id; oldContent: string }
    | { tag: "remove_board" }
    | { tag: "remove_column"; target: bsm.Id }
    | { tag: "remove_task"; target: bsm.Id }
    | {
        tag: "task_drag_start";
        task: bsm.Id;
        ref: HTMLElement;
        position: [number, number];
    }
    | {
        tag: "task_drag_end";
        task: bsm.Id;
        position: bsm.TaskPosition;
    }
    | {
        tag: "column_drag_start";
        column: bsm.Id;
        ref: HTMLElement;
        position: [number, number];
    }
    | {
        tag: "column_drag_end";
        column: bsm.Id;
        position: bsm.ColumnPosition;
    };

export type UiEventHandler = (event: UiEvent) => void;

async function removeBoard(board: storage.Id, storage: storage.Storage) {
    const res = await storage.deleteBoard({ board });
    if (!res.ok) {
        alert(res.message);
        return;
    }
    location.search = "";
}

async function attemptCommit(
    action: bsm.Action,
    storage: storage.Storage,
    { info, ref, history }: BoardStateConfig,
) {
    const hash = await bsm.hashBoard(info.initialTitle, [...history, action]);
    const res = await storage.executeAction({ action, hash, board: info.id });
    if (!res.ok) {
        alert(res.message);
        // most likely "invalid board hash", so we refresh
        location.reload();
        return;
    }
    bsm.execute({ board: ref, action });
    history.push(action);
    renderBoardPage({ info, ref, history }, storage);
}

export type BoardStateConfig = {
    info: { id: storage.Id; initialTitle: string };
    history: bsm.Action[];
    ref: bsm.Board;
};

export function handleUiEvent(
    board: BoardStateConfig,
    storage: storage.Storage,
    dragZoner: DragZoner,
    event: UiEvent,
) {
    switch (event.tag) {
        case "add_column": {
            const title = prompt("Title of column?");
            if (!title) {
                break;
            }
            const action: bsm.Action = {
                tag: "add_column",
                title,
            };
            attemptCommit(action, storage, board);
            break;
        }
        case "add_task": {
            const content = prompt("Content of task?");
            if (!content) {
                break;
            }
            const action: bsm.Action = {
                tag: "add_task",
                content,
                parent: event.parent,
            };
            attemptCommit(action, storage, board);
            break;
        }
        case "remove_board": {
            removeBoard(board.info.id, storage);
            break;
        }
        case "remove_column": {
            const action: bsm.Action = {
                tag: "remove_column",
                target: event.target,
            };
            attemptCommit(action, storage, board);
            break;
        }
        case "remove_task": {
            const action: bsm.Action = {
                tag: "remove_task",
                target: event.target,
            };
            attemptCommit(action, storage, board);
            break;
        }
        case "edit_board": {
            const title = prompt("New title?", event.oldTitle);
            if (!title) {
                break;
            }
            const action: bsm.Action = {
                tag: "edit_board",
                title,
            };
            attemptCommit(action, storage, board);
            break;
        }
        case "edit_column": {
            const title = prompt("New title?", event.oldTitle);
            if (!title) {
                break;
            }
            const action: bsm.Action = {
                tag: "edit_column",
                title,
                target: event.target,
            };
            attemptCommit(action, storage, board);
            break;
        }
        case "edit_task": {
            const content = prompt("New content?", event.oldContent);
            if (!content) {
                break;
            }
            const action: bsm.Action = {
                tag: "edit_task",
                content,
                target: event.target,
            };
            attemptCommit(action, storage, board);
            break;
        }
        case "task_drag_start": {
            new DragSession({
                dragZoner,
                eventHandler: (event: UiEvent) =>
                    handleUiEvent(
                        board,
                        storage,
                        dragZoner,
                        event,
                    ),
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
            const action: bsm.Action = {
                tag: "move_task",
                src: event.task,
                dest: event.position,
            };
            attemptCommit(action, storage, board);
            break;
        }

        case "column_drag_start": {
            new DragSession({
                dragZoner,
                eventHandler: (event: UiEvent) =>
                    handleUiEvent(
                        board,
                        storage,
                        dragZoner,
                        event,
                    ),
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
            const action: bsm.Action = {
                tag: "move_column",
                src: event.column,
                dest: event.position,
            };
            attemptCommit(action, storage, board);
            break;
        }
    }
}
