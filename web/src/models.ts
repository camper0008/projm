import { Id } from "bsm";

export type UiEvent =
    | { tag: "add_task"; parent: Id }
    | { tag: "remove_column"; target: Id }
    | { tag: "remove_task"; target: Id }
    | { tag: "edit_task"; target: Id }
    | { tag: "edit_column"; target: Id }
    | {
        tag: "drag_start";
        task: Id;
        ref: HTMLElement;
        position: [number, number];
    };

export type UiEventHandler = (event: UiEvent) => void;

