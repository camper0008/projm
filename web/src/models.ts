export type Id = string;

export interface Column {
    id: Id;
    title: string;
    children: Task[];
}

export interface Task {
    id: Id;
    content: string;
    children: Task[];
}

export type UiEvent = {
    type: "delete";
    column: Id;
    task: Id;
} | {
    type: "add";
    column: Id;
    task: Id;
} | {
    type: "drag_start";
    column: Id;
    task: Id;
    ref: HTMLElement;
};

export type UiEventHandler = (event: UiEvent) => void;
