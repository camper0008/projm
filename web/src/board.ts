import { Renderer } from "./render.ts";
import { DragZone } from "./drag_zone.ts";
import { Column, Id, Task, UiEvent } from "./models.ts";
import { Dragging } from "./dragging.ts";

export interface BoardOptions {
    element: HTMLElement;
    initialState: Column[];
}

export class Board {
    private element: HTMLElement;
    private state: Column[];
    private dragZone!: DragZone;
    private dragging!: Dragging | null;

    constructor({ element, initialState }: BoardOptions) {
        this.state = initialState;
        this.element = element;
        this.newSession();

        addEventListener(
            "mousemove",
            ({ clientX, clientY }: MouseEvent) =>
                this.mouseMoved([clientX, clientY]),
        );
        addEventListener(
            "mouseup",
            ({ clientX, clientY }: MouseEvent) =>
                this.mouseUp([clientX, clientY]),
        );
    }

    private findAndDeleteTask(options: { task: Id; tasks: Task[] }): boolean {
        const found = options.tasks.findIndex((v) => v.id === options.task);
        if (found !== -1) {
            options.tasks.splice(found, 1);
            return true;
        }

        for (const task of options.tasks) {
            const deleted = this.findAndDeleteTask({
                task: options.task,
                tasks: task.children,
            });
            if (deleted) {
                return true;
            }
        }

        return false;
    }

    private deleteTaskEvent(event: UiEvent & { "type": "delete" }) {
        const column = this.state.find((v) => v.id === event.column);
        if (!column) {
            throw new Error(
                "unreachable: cannot delete already deleted column",
            );
        }
        const success = this.findAndDeleteTask({
            task: event.task,
            tasks: column.children,
        });
        if (!success) {
            throw new Error(
                "unreachable: cannot delete already deleted task",
            );
        }
        this.newSession();
    }

    private handleUiEvent(event: UiEvent) {
        switch (event.type) {
            case "drag_start":
                if (this.dragging !== null) {
                    throw new Error(
                        "unreachable: began new dragging session without cleaning up old dragging session",
                    );
                }
                this.dragging = new Dragging({ ...event });
                this.dragZone.showZones();
                break;
            case "add":
                break;
            case "delete":
                return this.deleteTaskEvent(event);
        }
    }

    private mouseUp(position: [number, number]) {
        if (this.dragging === null) {
            return;
        }

        /* move dragging object or summin */
        this.dragZone.closestDragZone(position);

        this.dragZone.hideZones();
        this.dragging.destruct();
        this.dragging = null;
    }

    private mouseMoved(position: [number, number]) {
        if (this.dragging === null) {
            return;
        }
        this.dragging.moveGhost(position);
        const closest = this.dragZone.closestDragZone(position);
        this.dragZone.highlightZone(closest);
    }

    private newSession() {
        this.dragging = null;
        this.dragZone = new DragZone();
        const renderer = new Renderer({
            eventHandler: (event: UiEvent) => this.handleUiEvent(event),
            dragZone: this.dragZone,
        });
        this.element.replaceChildren(...renderer.render(this.state));
    }
}
