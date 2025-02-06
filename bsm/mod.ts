export type Id = {
    inner: number;
};

export type Task = {
    id: Id;
    typeId: "task";
    content: string;
    after: Task | null;
    child: Task | null;
};

export type Column = {
    id: Id;
    typeId: "column";
    title: string;
    after: Column | null;
    child: Task | null;
};

export type Board = {
    title: string;
    idCounter: number;
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
    | { tag: "remove_column"; target: Id }
    | { tag: "remove_task"; target: Id }
    | { tag: "move_task"; src: Id; dest: TaskPosition }
    | { tag: "move_column"; src: Id; dest: ColumnPosition }
    | { tag: "edit_task"; target: Id; content: string }
    | { tag: "edit_column"; target: Id; title: string }
    | { tag: "edit_board"; title: string };

function cmpId(left: Id, right: Id): boolean {
    return left.inner === right.inner;
}

function makeId(board: Board): Id {
    const id = {
        inner: board.idCounter,
    };
    board.idCounter += 1;
    return id;
}

export function makeBoard(title: string): Board {
    const board: Board = {
        title,
        idCounter: 0,
        child: null,
    };
    return board;
}

function encode(v: string): Uint8Array {
    return new TextEncoder().encode(v);
}

function decodeIntoHex(v: Uint8Array): string {
    return Array.from(v)
        .map((b: number) => b.toString(16).padStart(2, "0"))
        .join("");
}

async function hash(values: number[]): Promise<ArrayBuffer> {
    return await crypto.subtle.digest("SHA-1", new Uint8Array(values));
}

async function hashAction(
    action: Action,
    parent: Uint8Array,
): Promise<Uint8Array> {
    const content = encode(JSON.stringify(action));
    return await hash([...parent, ...content]).then((v) => new Uint8Array(v));
}

export async function hashBoard(
    initialTitle: string,
    actions: Action[],
): Promise<string> {
    if (actions.length === 0) {
        return await hash([...encode(initialTitle)])
            .then((hash) => new Uint8Array(hash))
            .then(decodeIntoHex);
    }

    return await actions.reduce(
        (acc, action) => acc.then((parent) => hashAction(action, parent)),
        Promise.resolve(encode(initialTitle)),
    ).then(decodeIntoHex);
}

export function execute({ board, action }: { board: Board; action: Action }) {
    switch (action.tag) {
        case "add_column": {
            addLastChild({
                dest: board,
                src: {
                    id: makeId(board),
                    typeId: "column",
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
            const parent = columnFromId(board.child, action.parent) ||
                taskFromId(board.child, action.parent);
            if (!parent) {
                throw new Error("task parent does not exist");
            }

            addLastChild({
                dest: parent,
                src: {
                    id: makeId(board),
                    typeId: "task",
                    content: action.content,
                    after: null,
                    child: null,
                },
            });
            break;
        }
        case "remove_column": {
            removeColumn(board, action.target);
            break;
        }
        case "remove_task": {
            removeTask(board, action.target);
            break;
        }
        case "move_task": {
            if (!board.child) {
                throw new Error("cannot add task without a column");
            }
            console.dir(action);
            console.dir(board);
            const src = removeTask(board, action.src);
            if (!src) {
                throw new Error("task  does not exist");
            }
            switch (action.dest.tag) {
                case "first_child_of": {
                    const dest =
                        columnFromId(board.child, action.dest.parent) ||
                        taskFromId(board.child, action.dest.parent);
                    if (!dest) {
                        throw new Error("task parent does not exist");
                    }
                    addFirstChild({ dest, src });
                    break;
                }
                case "after": {
                    const dest = taskFromId(board.child, action.dest.sibling);
                    if (!dest) {
                        throw new Error("task parent does not exist");
                    }
                    addAfter({ dest, src });
                    break;
                }
            }
            break;
        }
        case "move_column": {
            if (!board.child) {
                throw new Error("cannot add task without a column");
            }
            const src = removeColumn(board, action.src);
            if (!src) {
                throw new Error("column does not exist");
            }
            switch (action.dest.tag) {
                case "first_child": {
                    addFirstChild({ dest: board, src });
                    break;
                }
                case "after": {
                    const dest = columnFromId(
                        board.child,
                        action.dest.sibling,
                    );
                    if (!dest) {
                        throw new Error("task parent does not exist");
                    }
                    addAfter({ dest, src });
                    break;
                }
            }
            break;
        }
        case "edit_task": {
            if (!board.child) {
                throw new Error("cannot edit task without a column");
            }
            const target = taskFromId(board.child, action.target);
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
            const target = columnFromId(board.child, action.target);
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

function lastSibling<T extends { after: T | null }>(item: T): T {
    return item.after ? lastSibling(item.after) : item;
}

function columnFromId(item: Column, target: Id): Column | null {
    if (cmpId(item.id, target)) {
        return item;
    }
    return item.after !== null ? columnFromId(item.after, target) : null;
}

function isTask(value: Column | Task): value is Task {
    return value.typeId === "task";
}

function taskFromId(
    item: Column | Task,
    target: Id,
): Task | null {
    if (cmpId(item.id, target)) {
        if (!isTask(item)) {
            throw new Error("tried to access task with a column id");
        }
        return item;
    }
    const after = item.after !== null ? taskFromId(item.after, target) : null;
    if (after !== null) {
        return after;
    }

    const child = item.child !== null ? taskFromId(item.child, target) : null;
    if (child !== null) {
        return child;
    }

    return null;
}

type AddChild =
    | { dest: Task | Column; src: Task }
    | { dest: Board; src: Column };

function addFirstChild({ dest, src }: AddChild) {
    if (dest.child !== null) {
        src.after = dest.child;
        dest.child = src;
    } else {
        dest.child = src;
    }
}

function addLastChild({ dest, src }: AddChild) {
    if (dest.child !== null) {
        const last = lastSibling(dest.child);
        last.after = src;
    } else {
        dest.child = src;
    }
}

function addAfter<T extends Task | Column>(
    { dest, src }: { dest: T; src: T },
) {
    src.after = dest.after;
    dest.after = src;
}

function removeColumnAfter(before: Column, target: Id): Column | null {
    if (before.after === null) {
        return null;
    }

    if (cmpId(before.after.id, target)) {
        const removed = before.after;
        before.after = removed.after;
        removed.after = null;
        return removed;
    }

    return removeColumnAfter(before.after, target);
}

function removeColumn(board: Board, target: Id): Column | null {
    if (!board.child) {
        return null;
    }

    if (cmpId(board.child.id, target)) {
        const removed = board.child;
        board.child = board.child.after;
        removed.after = null;
        return removed;
    }

    return removeColumnAfter(board.child, target);
}

function removeTaskFromTask(before: Task, target: Id): Task | null {
    if (before.child) {
        if (cmpId(before.child.id, target)) {
            const removed = before.child;
            before.child = removed.after;
            removed.after = null;
            return removed;
        } else {
            const found = removeTaskFromTask(before.child, target);
            if (found) {
                return found;
            }
        }
    }

    if (before.after) {
        if (cmpId(before.after.id, target)) {
            const removed = before.after;
            before.after = removed.after;
            removed.after = null;
            return removed;
        } else {
            const found = removeTaskFromTask(before.after, target);
            if (found) {
                return found;
            }
        }
    }

    return null;
}

function removeTaskFromColumn(column: Column, target: Id): Task | null {
    if (!column.child) {
        return column.after ? removeTaskFromColumn(column.after, target) : null;
    }
    if (cmpId(column.child.id, target)) {
        const removed = column.child;
        column.child = removed.after;
        removed.after = null;
        return removed;
    }
    const found = removeTaskFromTask(column.child, target);
    if (found) {
        return found;
    }
    return column.after ? removeTaskFromColumn(column.after, target) : null;
}

function removeTask(board: Board, target: Id): Task | null {
    if (!board.child) {
        return null;
    }
    return removeTaskFromColumn(board.child, target);
}
