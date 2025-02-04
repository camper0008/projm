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

export type BoardState = {
    title: string;
    content: Column[];
};

type Board = {
    id: Id;
    state: BoardState;
};
