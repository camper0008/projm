import { Id } from "bsm";

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
        tag: "drag_start";
        task: Id;
        ref: HTMLElement;
        position: [number, number];
    };

export type UiEventHandler = (event: UiEvent) => void;
