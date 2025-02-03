import { DragZone } from "./src/drag.ts";
import { Column, Id, Task } from "./src/models.ts";

type HSL = `hsl(${number}, ${number}%, ${number}%)`;

interface Color {
    background: HSL;
    color: HSL;
}

export class Renderer {
    hslFromDepth(depth: number): Color {
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

    private taskToolbarButton(icon: string, tooltip: string): HTMLElement {
        const button = document.createElement("button");
        button.classList.add("task-toolbar-button");
        const iconElement = document.createElement("span");
        iconElement.classList.add("material-symbols-outlined");
        iconElement.textContent = icon;
        button.append(iconElement);
        button.title = tooltip;
        return button;
    }

    private taskToolbar(task: Task): HTMLElement {
        const toolbar = document.createElement("div");
        toolbar.classList.add("task-toolbar");

        const content = document.createElement("p");
        content.classList.add("task-content");
        content.innerText = task.content;
        toolbar.append(content);

        toolbar.append(
            this.taskToolbarButton("add_circle", "Add subtask"),
        );
        toolbar.append(
            this.taskToolbarButton("drag_indicator", "Rearrange task"),
        );
        toolbar.append(this.taskToolbarButton("delete", "Delete task"));

        return toolbar;
    }

    private task(
        task: Task,
        drag: DragZone,
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

        taskElement.append(this.taskToolbar(task));

        {
            let positionCounter = 0;
            for (const child of task.children) {
                taskElement.append(
                    drag.createDragZone(
                        { type: "task", id: task.id, column: column },
                        positionCounter,
                    ),
                );
                taskElement.append(
                    this.task(child, drag, column, depth + 1),
                );
                positionCounter += 1;
            }
            taskElement.append(
                drag.createDragZone(
                    { type: "task", id: task.id, column },
                    positionCounter,
                ),
            );
        }

        return taskElement;
    }

    private column(
        column: Column,
        drag: DragZone,
    ): HTMLElement {
        const columnElement = document.createElement("div");
        columnElement.classList.add("column");
        const title = document.createElement("p");
        title.classList.add("column-title");
        title.textContent = column.title;
        columnElement.append(title);

        let positionCounter = 0;
        for (const task of column.children) {
            columnElement.append(
                drag.createDragZone(
                    { type: "column", id: column.id },
                    positionCounter,
                ),
            );
            columnElement.append(this.task(task, drag, column.id, 0));
            positionCounter += 1;
        }
        columnElement.append(
            drag.createDragZone(
                { type: "column", id: column.id },
                positionCounter,
            ),
        );
        return columnElement;
    }

    render(
        columns: Column[],
        drag: DragZone,
    ): HTMLElement[] {
        return columns.map((v) => this.column(v, drag));
    }
}
