import { Drag } from "./drag.ts";
import { column } from "./dummy_data.ts";
import { Column, Id, Task } from "./models.ts";

type HSL = `hsl(${number}, ${number}%, ${number}%)`;

interface Color {
    background: HSL;
    color: HSL;
}

function hslFromDepth(depth: number): Color {
    const bgHue = 193;
    const bgSaturation = 100;
    const bgLightness = 30 - depth * 5;
    const background: HSL = `hsl(${bgHue}, ${bgSaturation}%, ${bgLightness}%)`;

    const fgHue = 193;
    const fgSaturation = 100;
    const fgLightness = bgLightness > 50 ? 5 : 95;
    const color: HSL = `hsl(${fgHue}, ${fgSaturation}%, ${fgLightness}%)`;

    return { background, color };
}

function renderTaskToolbarButton(icon: string, tooltip: string): HTMLElement {
    const button = document.createElement("button");
    button.classList.add("task-toolbar-button");
    const iconElement = document.createElement("span");
    iconElement.classList.add("material-symbols-outlined");
    iconElement.textContent = icon;
    button.append(iconElement);
    button.title = tooltip;
    return button;
}

function renderTaskToolbar(task: Task): HTMLElement {
    const toolbar = document.createElement("div");
    toolbar.classList.add("task-toolbar");

    const content = document.createElement("p");
    content.classList.add("task-content");
    content.innerText = task.content;
    toolbar.append(content);

    toolbar.append(renderTaskToolbarButton("add_circle", "Add subtask"));
    toolbar.append(renderTaskToolbarButton("delete", "Delete task"));

    return toolbar;
}

function renderTask(
    task: Task,
    drag: Drag,
    column: Id,
    depth: number,
): HTMLElement {
    const taskElement = document.createElement("div");
    taskElement.classList.add("task");
    taskElement.dataset["id"] = task.id.toString();
    taskElement.dataset["depth"] = depth.toString();
    const colors = hslFromDepth(depth);
    taskElement.style.backgroundColor = colors.background;
    taskElement.style.color = colors.color;

    taskElement.append(renderTaskToolbar(task));

    {
        let positionCounter = 0;
        for (const child of task.children) {
            taskElement.append(
                drag.createDragZone(
                    { type: "task", id: task.id, column: column },
                    positionCounter,
                ),
            );
            taskElement.append(renderTask(child, drag, column, depth + 1));
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

function renderColumn(
    column: Column,
    drag: Drag,
): HTMLElement {
    const columnElement = document.createElement("div");
    columnElement.classList.add("column");
    const title = document.createElement("p");
    title.classList.add("column-title");
    title.textContent = column.title;
    columnElement.append(title);

    let positionCounter = 0;
    for (const task of column.tasks) {
        columnElement.append(
            drag.createDragZone(
                { type: "column", id: column.id },
                positionCounter,
            ),
        );
        columnElement.append(renderTask(task, drag, column.id, 0));
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

function main() {
    const board = document.querySelector("#board");
    if (!board) {
        throw Error("unreachable: defined in index.html");
    }

    const drag = new Drag();

    const column0 = renderColumn(column(), drag);
    const column1 = renderColumn(column(), drag);
    board.append(column0, column1);

    drag.showZones();

    addEventListener("mousemove", (event) => {
        const closestZone = drag.closestDragZone([event.x, event.y]);
        drag.highlightZone(closestZone);
    });
}

main();
