import { Renderer } from "./render.ts";
import { DragZone, Zone } from "./drag_zone.ts";
import { Column, Id, Task, UiEvent } from "./models.ts";
import { Dragging } from "./dragging.ts";
import { id } from "./id.ts";

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
            /// TODO: add a "Client.removeTask(): Task" call

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

    private findAndMoveTask(zone: Zone) {
    }

    private dragStartEvent(event: UiEvent & { "type": "drag_start" }) {
        if (this.dragging !== null) {
            throw new Error(
                "unreachable: began new dragging session without cleaning up old dragging session",
            );
        }
        this.dragging = new Dragging({ ...event });
        this.dragZone.showZones();
    }

    private findAndAddTask(
        options: { content: string; task: Id; tasks: Task[] },
    ): boolean {
        const found = options.tasks.find((v) => v.id === options.task);
        if (found !== undefined) {
            /// TODO: replace with a "Client.createTask(): Task" call
            found.children.push({
                id: id(),
                content: options.content,
                children: [],
            });
            return true;
        }

        for (const task of options.tasks) {
            const added = this.findAndAddTask({
                content: options.content,
                task: options.task,
                tasks: task.children,
            });
            if (added) {
                return true;
            }
        }

        return false;
    }

    private addTaskEvent(event: UiEvent & { "type": "add" }) {
        const column = this.state.find((v) => v.id === event.column);
        if (!column) {
            throw new Error(
                "unreachable: cannot add to deleted column",
            );
        }
        const content = prompt("Content of task?");
        if (!content) {
            return;
        }
        const success = this.findAndAddTask({
            content,
            task: event.task,
            tasks: column.children,
        });
        if (!success) {
            throw new Error(
                "unreachable: cannot add to deleted task",
            );
        }
        this.newSession();
    }

    private handleUiEvent(event: UiEvent) {
        console.log("event:", event);
        switch (event.type) {
            case "drag_start":
                return this.dragStartEvent(event);
            case "add":
                return this.addTaskEvent(event);
            case "delete":
                return this.deleteTaskEvent(event);
        }
    }

    private mouseUp(position: [number, number]) {
        if (this.dragging === null) {
            return;
        }

        /* move dragging object or summin */
        const closest = this.dragZone.closestDragZone(position);
        const pos = this.dragZone.zoneFromId(closest);

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
