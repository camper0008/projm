export type Id = string;

export interface Column {
    id: Id;
    title: string;
    tasks: Task[];
}

export interface Task {
    id: Id;
    content: string;
    children: Task[];
}
