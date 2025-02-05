import { ColumnPosition, Id, TaskPosition } from "bsm";

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
