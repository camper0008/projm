import { DragZone } from "./drag_zone.ts";
import { UiEventHandler } from "./models.ts";
import { Board, Column, Id, Task } from "bsm";

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
        prev: HTMLElement[],
        task: Task | null,
        depth: number,
    ): HTMLElement[] {
        if (!task) {
            return prev;
        }
        const taskElement = document.createElement("div");
        taskElement.classList.add("task");
        const colors = this.hslFromDepth(depth);
        taskElement.style.backgroundColor = colors.background;
        taskElement.style.color = colors.color;

        taskElement.append(this.taskToolbar(task, taskElement));

        {
            let positionCounter = 0;
            for (const child of task.children) {
                taskElement.append(
                    this.dragZone.createDragZone(
                        { type: "task", parent: task.id, column: column },
                        positionCounter,
                    ),
                );
                taskElement.append(
                    this.task(child, column, depth + 1),
                );
                positionCounter += 1;
            }
            taskElement.append(
                this.dragZone.createDragZone(
                    { type: "task", parent: task.id, column },
                    positionCounter,
                ),
            );
        }

        return taskElement;
    }

    private column(
        prev: HTMLElement[],
        column: Column | null,
    ): HTMLElement[] {
        if (!column) {
            return prev;
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

        toolbar.append(title, addButton);
        columnElement.append(toolbar);

        const tasks = this.task([], column.child, 0);
        columnElement.append(this.dragZone.createDragZone(
            { tag: "first_child_of", parent: column.id },
        ));
        let positionCounter = 0;
        for (const task of column.children) {
            columnElement.append(
                this.dragZone.createDragZone(
                    { tag: "column", parent: column.id },
                    positionCounter,
                ),
            );
            columnElement.append(
                this.task(task, column.id, 0),
            );
            positionCounter += 1;
        }
        columnElement.append(
            this.dragZone.createDragZone(
                { tag: "column", parent: column.id },
                positionCounter,
            ),
        );
        this.column([...prev, columnElement], column.after);
    }

    render(
        board: Board,
    ): HTMLElement[] {
        return this.column([], board.child);
    }
}
