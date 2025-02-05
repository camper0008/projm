type Id = {
    inner: number;
};

type Task = {
    id: Id;
    type_id: "task";
    content: string;
    after: Task | null;
    child: Task | null;
};

type Column = {
    id: Id;
    type_id: "column";
    title: string;
    after: Column | null;
    child: Task | null;
};

type Board = {
    id: Id;
    title: string;
    child: Column | null;
};

type TaskPosition =
    | { tag: "first_child_of"; id: Id }
    | { tag: "after"; id: Id };

type ColumnPosition =
    | { tag: "first_child" }
    | { tag: "after"; id: Id };

type Action =
    | { tag: "add_column"; title: string }
    | { tag: "add_task"; content: string }
    | { tag: "delete_column"; target: Id }
    | { tag: "delete_task"; target: Id }
    | { tag: "move_task"; src: Id; dest: TaskPosition }
    | { tag: "move_column"; src: Id; dest: ColumnPosition }
    | { tag: "edit_task"; target: Id; content: string }
    | { tag: "edit_column"; target: Id; title: string }
    | { tag: "edit_board"; title: string };

function id_cmp(left: Id, right: Id): boolean {
    return left.inner === right.inner;
}

function last_sibling<T extends { after: T | null }>(item: T): T {
    return item.after ? last_sibling(item.after) : item;
}

function column_from_id(item: Column, target: Id): Column | null {
    if (id_cmp(item.id, target)) {
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
    if (id_cmp(item.id, target)) {
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

function add_after<T extends Task | Column>(dest: T, src: T) {
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
        id: { inner: ids++ },
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
