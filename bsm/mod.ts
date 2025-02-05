export type Id = {
    inner: number;
};

export type Task = {
    id: Id;
    type_id: "task";
    content: string;
    after: Task | null;
    child: Task | null;
};

export type Column = {
    id: Id;
    type_id: "column";
    title: string;
    after: Column | null;
    child: Task | null;
};

export type Board = {
    title: string;
    id_counter: number;
    child: Column | null;
};

export type TaskPosition =
    | { tag: "first_child_of"; parent: Id }
    | { tag: "after"; sibling: Id };

export type ColumnPosition =
    | { tag: "first_child" }
    | { tag: "after"; sibling: Id };

export type Action =
    | { tag: "add_column"; title: string }
    | { tag: "add_task"; parent: Id; content: string }
    | { tag: "delete_column"; target: Id }
    | { tag: "delete_task"; target: Id }
    | { tag: "move_task"; src: Id; dest: TaskPosition }
    | { tag: "move_column"; src: Id; dest: ColumnPosition }
    | { tag: "edit_task"; target: Id; content: string }
    | { tag: "edit_column"; target: Id; title: string }
    | { tag: "edit_board"; title: string };

function cmp_id(left: Id, right: Id): boolean {
    return left.inner === right.inner;
}

function new_id(board: Board): Id {
    const id = {
        inner: board.id_counter,
    };
    board.id_counter += 1;
    return id;
}

export function new_board(title: string): Board {
    const board: Board = {
        title,
        id_counter: 0,
        child: null,
    };
    board.child = {
        id: new_id(board),
        type_id: "column",
        title: "todo",
        after: {
            id: new_id(board),
            type_id: "column",
            title: "doing",
            after: {
                id: new_id(board),
                type_id: "column",
                title: "done",
                after: null,
                child: null,
            },
            child: null,
        },
        child: null,
    };
    return board;
}

export function do_action(board: Board, action: Action) {
    switch (action.tag) {
        case "add_column": {
            add_last_child({
                dest: board,
                src: {
                    id: new_id(board),
                    type_id: "column",
                    title: action.title,
                    after: null,
                    child: null,
                },
            });
            break;
        }
        case "add_task": {
            if (!board.child) {
                throw new Error("cannot add task without a column");
            }
            const parent = column_from_id(board.child, action.parent) ||
                task_from_id(board.child, action.parent);
            if (!parent) {
                throw new Error("task parent does not exist");
            }

            add_last_child({
                dest: parent,
                src: {
                    id: new_id(board),
                    type_id: "task",
                    content: action.content,
                    after: null,
                    child: null,
                },
            });
            break;
        }
        case "delete_column": {
            remove_column(board, action.target);
            break;
        }
        case "delete_task": {
            remove_task(board, action.target);
            break;
        }
        case "move_task": {
            if (!board.child) {
                throw new Error("cannot add task without a column");
            }
            const src = remove_task(board, action.src);
            if (!src) {
                throw new Error("task  does not exist");
            }
            switch (action.dest.tag) {
                case "first_child_of": {
                    const dest =
                        column_from_id(board.child, action.dest.parent) ||
                        task_from_id(board.child, action.dest.parent);
                    if (!dest) {
                        throw new Error("task parent does not exist");
                    }
                    add_first_child({ dest, src });
                    break;
                }
                case "after": {
                    const dest = task_from_id(board.child, action.dest.sibling);
                    if (!dest) {
                        throw new Error("task parent does not exist");
                    }
                    add_after({ dest, src });
                    break;
                }
            }
            break;
        }
        case "move_column": {
            if (!board.child) {
                throw new Error("cannot add task without a column");
            }
            const src = remove_column(board, action.src);
            if (!src) {
                throw new Error("column does not exist");
            }
            switch (action.dest.tag) {
                case "first_child": {
                    add_first_child({ dest: board, src });
                    break;
                }
                case "after": {
                    const dest = column_from_id(
                        board.child,
                        action.dest.sibling,
                    );
                    if (!dest) {
                        throw new Error("task parent does not exist");
                    }
                    add_after({ dest, src });
                    break;
                }
            }
            break;
        }
        case "edit_task": {
            if (!board.child) {
                throw new Error("cannot edit task without a column");
            }
            const target = task_from_id(board.child, action.target);
            if (!target) {
                throw new Error("task does not exist");
            }
            target.content = action.content;
            break;
        }
        case "edit_column": {
            if (!board.child) {
                throw new Error("cannot edit task without a column");
            }
            const target = column_from_id(board.child, action.target);
            if (!target) {
                throw new Error("task does not exist");
            }
            target.title = action.title;
            break;
        }
        case "edit_board": {
            board.title = action.title;
            break;
        }
    }
}

function last_sibling<T extends { after: T | null }>(item: T): T {
    return item.after ? last_sibling(item.after) : item;
}

function column_from_id(item: Column, target: Id): Column | null {
    if (cmp_id(item.id, target)) {
        return item;
    }
    return item.after !== null ? column_from_id(item.after, target) : null;
}

function is_task(value: Column | Task): value is Task {
    return value.type_id === "task";
}

function task_from_id(
    item: Column | Task,
    target: Id,
): Task | null {
    if (cmp_id(item.id, target)) {
        if (!is_task(item)) {
            throw new Error("tried to access task with a column id");
        }
        return item;
    }
    const after = item.after !== null ? task_from_id(item.after, target) : null;
    if (after !== null) {
        return after;
    }

    const child = item.child !== null ? task_from_id(item.child, target) : null;
    if (child !== null) {
        return child;
    }

    return null;
}

type AddChild =
    | { dest: Task | Column; src: Task }
    | { dest: Board; src: Column };

function add_first_child({ dest, src }: AddChild) {
    if (dest.child !== null) {
        src.after = dest.child;
        dest.child = src;
    } else {
        dest.child = src;
    }
}

function add_last_child({ dest, src }: AddChild) {
    if (dest.child !== null) {
        const last = last_sibling(dest.child);
        last.after = src;
    } else {
        dest.child = src;
    }
}

function add_after<T extends Task | Column>(
    { dest, src }: { dest: T; src: T },
) {
    src.after = dest.after;
    dest.after = src;
}

function remove_column_after(before: Column, target: Id): Column | null {
    if (before.after === null) {
        return null;
    }

    if (before.after.id === target) {
        const removed = before.after;
        before.after = removed.after;
        removed.after = null;
        return removed;
    }

    return null;
}

function remove_column(board: Board, target: Id): Column | null {
    if (!board.child) {
        return null;
    }

    if (board.child.id === target) {
        const removed = board.child;
        board.child = board.child.after;
        removed.after = null;
        return removed;
    }

    return remove_column_after(board.child, target);
}

function remove_task_task(before: Task, target: Id): Task | null {
    if (before.child) {
        if (before.child.id === target) {
            const removed = before.child;
            before.child = removed.after;
            removed.after = null;
            return removed;
        } else {
            const found = remove_task_task(before.child, target);
            if (found) {
                return found;
            }
        }
    }

    if (before.after) {
        if (before.after.id === target) {
            const removed = before.after;
            before.after = removed.after;
            removed.after = null;
            return removed;
        } else {
            const found = remove_task_task(before.after, target);
            if (found) {
                return found;
            }
        }
    }

    return null;
}

function remove_task_column(column: Column, target: Id): Task | null {
    if (!column.child) {
        return column.after ? remove_task_column(column.after, target) : null;
    }
    if (column.child.id === target) {
        const removed = column.child;
        column.child = removed.after;
        removed.after = null;
        return removed;
    }

    const found = remove_task_task(column.child, target);
    if (found) {
        return found;
    }

    return column.after ? remove_task_column(column.after, target) : null;
}

function remove_task(board: Board, target: Id): Task | null {
    if (!board.child) {
        return null;
    }
    return remove_task_column(board.child, target);
}

Deno.test("worx", () => {
    let ids = 0;
    let colId;
    let task1Id;
    let task2Id;
    const b: Board = {
        id_counter: 0,
        title: "a",
        child: {
            id: colId = { inner: ids++ },
            type_id: "column",
            title: "b",
            child: {
                id: task1Id = { inner: ids++ },
                type_id: "task",
                content: "task 1",
                child: null,
                after: {
                    id: task2Id = { inner: ids++ },
                    type_id: "task",
                    content: "task 2",
                    child: null,
                    after: null,
                },
            },
            after: null,
        },
    };

    remove_task(b, task2Id);
    console.assert(b.child!.child!.child === null);
    remove_task(b, task1Id);
    console.assert(b.child!.child === null);
    remove_column(b, colId);
    console.assert(b.child === null);
});
