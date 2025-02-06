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

    private taskToolbar(
        task: Task,
        taskElement: HTMLElement,
    ): HTMLElement {
        const toolbar = document.createElement("div");
        toolbar.classList.add("task-toolbar");

        const content = document.createElement("p");
        content.classList.add("task-content");
        content.innerText = task.content;
        toolbar.append(content);

        const addButton = this.taskToolbarButton("add_circle", "Add subtask");
        addButton.addEventListener("click", () => {
            this.eventHandler({
                tag: "add_task",
                parent: task.id,
            });
        });

        const editButton = this.taskToolbarButton("edit", "Edit task");
        editButton.addEventListener("click", () => {
            this.eventHandler({
                tag: "edit_task",
                target: task.id,
                oldContent: task.content,
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

        toolbar.append(addButton, editButton, dragButton, removeButton);

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
        const title = document.createElement("p");
        title.classList.add("column-title");
        title.textContent = column.title;

        const addButton = this.columnToolbarButton("add_circle", "Add task");
        addButton.addEventListener("click", () => {
            this.eventHandler({ tag: "add_task", parent: column.id });
        });

        const editButton = this.columnToolbarButton("edit", "Edit column");
        editButton.addEventListener("click", () => {
            this.eventHandler({
                tag: "edit_column",
                target: column.id,
                oldTitle: column.title,
            });
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

        toolbar.append(title, addButton, editButton, dragButton, removeButton);
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

    private boardToolbar(
        board: Board,
    ): HTMLElement {
        const toolbar = document.createElement("div");
        toolbar.classList.add("board-toolbar");

        const title = document.createElement("p");
        title.classList.add("board-title");
        title.innerText = board.title;
        toolbar.append(title);

        const addButton = this.boardToolbarButton("add_circle", "Add column");
        addButton.addEventListener("click", () => {
            this.eventHandler({
                tag: "add_column",
            });
        });

        const editButton = this.boardToolbarButton("edit", "Edit board");
        editButton.addEventListener("click", () => {
            this.eventHandler({
                tag: "edit_board",
                oldTitle: board.title,
            });
        });

        const removeButton = this.boardToolbarButton("delete", "Delete board");
        removeButton.addEventListener("click", () => {
            this.eventHandler({
                tag: "remove_board",
            });
        });

        toolbar.append(addButton, editButton, removeButton);

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
