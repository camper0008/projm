import { DragZone } from "./drag_zone.ts";
import { Board, Column, Task } from "bsm";
import { UiEventHandler } from "./ui_event.ts";

type HSL = `hsl(${number}, ${number}%, ${number}%)`;

interface Color {
    background: HSL;
    color: HSL;
}

interface RendererOptions {
    dragZone: DragZone;
    eventHandler: UiEventHandler;
}

export class Renderer {
    private eventHandler: UiEventHandler;
    private dragZone: DragZone;

    constructor({ dragZone, eventHandler }: RendererOptions) {
        this.eventHandler = eventHandler;
        this.dragZone = dragZone;
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
    ): HTMLElement {
        const button = document.createElement("button");
        button.classList.add("column-toolbar-button");
        const iconElement = document.createElement("span");
        iconElement.classList.add("material-symbols-outlined");
        iconElement.textContent = icon;
        button.append(iconElement);
        button.title = tooltip;
        button.style.cursor = "pointer";
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
                tag: "drag_start",
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
        taskElement.append(this.dragZone.createDragZone(
            { tag: "first_child_of", parent: task.id },
        ));
        taskElement.append(...this.task(task.child, depth + 1, []));

        const dragAfter = this.dragZone.createDragZone(
            { tag: "after", sibling: task.id },
        );

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

        const removeButton = this.columnToolbarButton(
            "delete",
            "Remove column",
        );
        removeButton.addEventListener("click", () => {
            this.eventHandler({ tag: "remove_column", target: column.id });
        });

        toolbar.append(title, addButton, editButton, removeButton);
        columnElement.append(toolbar);
        columnElement.append(this.dragZone.createDragZone(
            { tag: "first_child_of", parent: column.id },
        ));
        columnElement.append(...this.task(column.child));
        return this.column(column.after, [...siblings, columnElement]);
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

    render_content(
        board: Board,
    ) {
        const toolbar = this.boardToolbar(board);
        const content = document.createElement("div");
        content.classList.add("board-content");
        content.append(...this.column(board.child));
        return [toolbar, content];
    }
}
