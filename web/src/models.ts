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
    type: "add_on_task";
    column: Id;
    task: Id;
} | {
    type: "add_on_column";
    column: Id;
} | {
    type: "edit";
    column: Id;
    task: Id;
} | {
    type: "drag_start";
    column: Id;
    task: Id;
    ref: HTMLElement;
    position: [number, number];
};

export type UiEventHandler = (event: UiEvent) => void;
