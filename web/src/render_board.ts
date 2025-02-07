import { DragZoner } from "./drag_zoner.ts";
import { Board, Column, Task } from "bsm";
import { UiEventHandler } from "./ui_event.ts";

type HSL = `hsl(${number}, ${number}%, ${number}%)`;

interface Color {
    background: HSL;
    color: HSL;
}

interface RendererOptions {
    dragZoner: DragZoner;
    eventHandler: UiEventHandler;
    board: Board;
}

export class Renderer {
    private eventHandler: UiEventHandler;
    private dragZoner: DragZoner;
    private board: Board;

    constructor({ dragZoner, eventHandler, board }: RendererOptions) {
        this.eventHandler = eventHandler;
        this.dragZoner = dragZoner;
        this.board = board;
    }

    private hslFromDepth(depth: number): Color {
        const bgHue = 193;
        const bgSaturation = 100;
        const bgLightness = 30 - depth * 5;
        const background: HSL =
            `hsl(${bgHue}, ${bgSaturation}%, ${bgLightness}%)`;

        const fgHue = 193;
        const fgSaturation = 100;
        const fgLightness = bgLightness > 50 ? 5 : 95;
        const color: HSL = `hsl(${fgHue}, ${fgSaturation}%, ${fgLightness}%)`;

        return { background, color };
    }

    private boardToolbarButton(
        icon: string,
        tooltip: string,
    ): HTMLElement {
        const button = document.createElement("button");
        button.classList.add("board-toolbar-button");
        const iconElement = document.createElement("span");
        iconElement.classList.add("material-symbols-outlined");
        iconElement.textContent = icon;
        button.append(iconElement);
        button.title = tooltip;
        button.style.cursor = "pointer";
        return button;
    }

    private columnToolbarButton(
        icon: string,
        tooltip: string,
        cursor: string = "pointer",
    ): HTMLElement {
        const button = document.createElement("button");
        button.classList.add("column-toolbar-button");
        const iconElement = document.createElement("span");
        iconElement.classList.add("material-symbols-outlined");
        iconElement.textContent = icon;
        button.append(iconElement);
        button.title = tooltip;
        button.style.cursor = cursor;
        return button;
    }

    private taskToolbarButton(
        icon: string,
        tooltip: string,
        cursor: string = "pointer",
    ): HTMLElement {
        const button = document.createElement("button");
        button.classList.add("task-toolbar-button");
        const iconElement = document.createElement("span");
        iconElement.classList.add("material-symbols-outlined");
        iconElement.textContent = icon;
        button.append(iconElement);
        button.title = tooltip;
        button.style.cursor = cursor;
        return button;
    }

    private taskContent(task: Task): HTMLElement {
        const content = document.createElement("p");
        content.classList.add("task-content");
        content.textContent = task.content.trim();
        content.tabIndex = 0;

        const input = document.createElement("input");
        input.classList.add("task-content");
        input.value = task.content;

        const editing = () => {
            const selection = getSelection();
            if (selection && !selection.isCollapsed) {
                return;
            }

            content.replaceWith(input);

            requestAnimationFrame(() => {
                input.focus();
                input.setSelectionRange(
                    task.content.length,
                    task.content.length,
                );
            });
        };

        const submitted = (value: string) => {
            if (value === task.content) {
                input.replaceWith(content);
                return;
            }
            this.eventHandler({
                tag: "edit_board",
                title: value,
            });
        };

        input.addEventListener("blur", () => submitted(input.value.trim()));
        input.addEventListener(
            "keypress",
            (event) => event.key === "Enter" && input.blur(),
        );

        content.addEventListener("focus", () => editing());
        content.addEventListener("click", () => editing());

        return content;
    }

    private taskToolbar(
        task: Task,
        taskElement: HTMLElement,
    ): HTMLElement {
        const toolbar = document.createElement("div");
        toolbar.classList.add("task-toolbar");

        const content = this.taskContent(task);

        toolbar.append(content);

        const buttonGroup = document.createElement("div");
        buttonGroup.classList.add("button-group");

        const addButton = this.taskToolbarButton("add_circle", "Add subtask");
        addButton.addEventListener("click", () => {
            this.eventHandler({
                tag: "add_task",
                parent: task.id,
            });
        });

        const removeButton = this.taskToolbarButton("delete", "Delete task");
        removeButton.addEventListener("click", () => {
            this.eventHandler({
                tag: "remove_task",
                target: task.id,
            });
        });

        const dragButton = this.taskToolbarButton(
            "drag_indicator",
            "Rearrange task",
            "grab",
        );

        dragButton.addEventListener("mousedown", (event) => {
            this.eventHandler({
                tag: "task_drag_start",
                task: task.id,
                ref: taskElement,
                position: [event.pageX, event.pageY],
            });
        });

        buttonGroup.append(addButton, dragButton, removeButton);
        toolbar.append(buttonGroup);

        return toolbar;
    }

    private task(
        task: Task | null,
        depth: number = 0,
        siblings: HTMLElement[] = [],
    ): HTMLElement[] {
        if (!task) {
            return siblings;
        }
        const taskElement = document.createElement("div");
        taskElement.classList.add("task");
        const colors = this.hslFromDepth(depth);
        taskElement.style.backgroundColor = colors.background;
        taskElement.style.color = colors.color;

        taskElement.append(this.taskToolbar(task, taskElement));
        taskElement.append(
            this.dragZoner.createDragZone({
                tag: "task",
                position: { tag: "first_child_of", parent: task.id },
            }),
        );
        taskElement.append(...this.task(task.child, depth + 1, []));

        const dragAfter = this.dragZoner.createDragZone({
            tag: "task",
            position: { tag: "after", sibling: task.id },
        });

        return this.task(task.after, depth, [
            ...siblings,
            taskElement,
            dragAfter,
        ]);
    }

    private columnTitle(column: Column): HTMLElement {
        const title = document.createElement("p");
        title.classList.add("column-title");
        title.textContent = column.title.trim();
        title.tabIndex = 0;

        const input = document.createElement("input");
        input.classList.add("column-title");
        input.value = column.title;

        const editing = () => {
            const selection = getSelection();
            if (selection && !selection.isCollapsed) {
                return;
            }

            title.replaceWith(input);

            requestAnimationFrame(() => {
                input.focus();
                input.setSelectionRange(
                    column.title.length,
                    column.title.length,
                );
            });
        };

        const submitted = (value: string) => {
            if (value === column.title) {
                input.replaceWith(title);
                return;
            }
            this.eventHandler({
                tag: "edit_column",
                target: column.id,
                title: value,
            });
        };

        input.addEventListener("blur", () => submitted(input.value.trim()));
        input.addEventListener(
            "keypress",
            (event) => event.key === "Enter" && input.blur(),
        );

        title.addEventListener("focus", () => editing());
        title.addEventListener("click", () => editing());

        return title;
    }

    private column(
        column: Column | null,
        siblings: HTMLElement[] = [],
    ): HTMLElement[] {
        if (!column) {
            return siblings;
        }
        const columnElement = document.createElement("div");
        columnElement.classList.add("column");
        const toolbar = document.createElement("div");
        toolbar.classList.add("column-toolbar");
        const title = this.columnTitle(column);

        const buttonGroup = document.createElement("div");
        buttonGroup.classList.add("button-group");

        const addButton = this.columnToolbarButton("add_circle", "Add task");
        addButton.addEventListener("click", () => {
            this.eventHandler({ tag: "add_task", parent: column.id });
        });

        const dragButton = this.columnToolbarButton(
            "drag_indicator",
            "Rearrange column",
            "grab",
        );

        dragButton.addEventListener("mousedown", (event) => {
            this.eventHandler({
                tag: "column_drag_start",
                column: column.id,
                ref: columnElement,
                position: [event.pageX, event.pageY],
            });
        });

        const removeButton = this.columnToolbarButton(
            "delete",
            "Remove column",
        );
        removeButton.addEventListener("click", () => {
            this.eventHandler({ tag: "remove_column", target: column.id });
        });

        buttonGroup.append(addButton, dragButton, removeButton);
        toolbar.append(title, buttonGroup);
        columnElement.append(toolbar);
        columnElement.append(
            this.dragZoner.createDragZone({
                tag: "task",
                position: { tag: "first_child_of", parent: column.id },
            }),
        );
        columnElement.append(...this.task(column.child));

        const afterDragZone = this.dragZoner.createDragZone({
            tag: "column",
            position: { tag: "after", sibling: column.id },
        });

        return this.column(column.after, [
            ...siblings,
            columnElement,
            afterDragZone,
        ]);
    }

    private boardTitle(board: Board): HTMLElement {
        const title = document.createElement("p");
        title.classList.add("board-title");
        title.textContent = board.title.trim();
        title.tabIndex = 0;

        const input = document.createElement("input");
        input.classList.add("board-title");
        input.value = board.title;

        const editing = () => {
            const selection = getSelection();
            if (selection && !selection.isCollapsed) {
                return;
            }

            title.replaceWith(input);

            requestAnimationFrame(() => {
                input.focus();
                input.setSelectionRange(
                    board.title.length,
                    board.title.length,
                );
            });
        };

        const submitted = (value: string) => {
            if (value === board.title) {
                input.replaceWith(title);
                return;
            }
            this.eventHandler({
                tag: "edit_board",
                title: value,
            });
        };

        input.addEventListener("blur", () => submitted(input.value.trim()));
        input.addEventListener(
            "keypress",
            (event) => event.key === "Enter" && input.blur(),
        );

        title.addEventListener("focus", () => editing());
        title.addEventListener("click", () => editing());

        return title;
    }

    private boardToolbar(
        board: Board,
    ): HTMLElement {
        const toolbar = document.createElement("div");
        toolbar.classList.add("board-toolbar");

        const title = this.boardTitle(board);
        toolbar.append(title);

        const addButton = this.boardToolbarButton("add_circle", "Add column");
        addButton.addEventListener("click", () => {
            this.eventHandler({
                tag: "add_column",
            });
        });

        const removeButton = this.boardToolbarButton("delete", "Delete board");
        removeButton.addEventListener("click", () => {
            this.eventHandler({
                tag: "remove_board",
            });
        });

        toolbar.append(addButton, removeButton);

        return toolbar;
    }

    render(): HTMLElement[] {
        const toolbar = this.boardToolbar(this.board);
        const firstChildDragZone = this.dragZoner.createDragZone({
            tag: "column",
            position: { tag: "first_child" },
        });
        const content = document.createElement("div");
        content.classList.add("board-content");
        content.append(firstChildDragZone, ...this.column(this.board.child));
        return [toolbar, content];
    }
}
