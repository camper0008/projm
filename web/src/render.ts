import { DragZone } from "./drag_zone.ts";
import { Column, Id, Task, UiEventHandler } from "./models.ts";

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
        column: Id,
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
                type: "add_on_task",
                task: task.id,
                column: column,
            });
        });

        const editButton = this.taskToolbarButton("edit", "Edit task");
        editButton.addEventListener("click", () => {
            this.eventHandler({
                type: "edit",
                task: task.id,
                column: column,
            });
        });

        const removeButton = this.taskToolbarButton("delete", "Delete task");
        removeButton.addEventListener("click", () => {
            this.eventHandler({
                type: "delete",
                task: task.id,
                column: column,
            });
        });

        const dragButton = this.taskToolbarButton(
            "drag_indicator",
            "Rearrange task",
            "grab",
        );
        dragButton.addEventListener("mousedown", (event) => {
            this.eventHandler({
                type: "drag_start",
                task: task.id,
                column: column,
                ref: taskElement,
                position: [event.pageX, event.pageY],
            });
        });

        toolbar.append(addButton, editButton, dragButton, removeButton);

        return toolbar;
    }

    private task(
        task: Task,
        column: Id,
        depth: number,
    ): HTMLElement {
        const taskElement = document.createElement("div");
        taskElement.classList.add("task");
        taskElement.dataset["id"] = task.id.toString();
        taskElement.dataset["depth"] = depth.toString();
        const colors = this.hslFromDepth(depth);
        taskElement.style.backgroundColor = colors.background;
        taskElement.style.color = colors.color;

        taskElement.append(this.taskToolbar(column, task, taskElement));

        {
            let positionCounter = 0;
            for (const child of task.children) {
                taskElement.append(
                    this.dragZone.createDragZone(
                        { type: "task", id: task.id, column: column },
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
                    { type: "task", id: task.id, column },
                    positionCounter,
                ),
            );
        }

        return taskElement;
    }

    private column(
        column: Column,
    ): HTMLElement {
        const columnElement = document.createElement("div");
        columnElement.classList.add("column");
        const toolbar = document.createElement("div");
        toolbar.classList.add("column-toolbar");
        const title = document.createElement("p");
        title.classList.add("column-title");
        title.textContent = column.title;

        const addButton = this.columnToolbarButton("add_circle", "Add task");
        addButton.addEventListener("click", () => {
            this.eventHandler({ type: "add_on_column", column: column.id });
        });

        toolbar.append(title, addButton);
        columnElement.append(toolbar);

        let positionCounter = 0;
        for (const task of column.children) {
            columnElement.append(
                this.dragZone.createDragZone(
                    { type: "column", id: column.id },
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
                { type: "column", id: column.id },
                positionCounter,
            ),
        );
        return columnElement;
    }

    render(
        columns: Column[],
    ): HTMLElement[] {
        return columns.map((column) => this.column(column));
    }
}
