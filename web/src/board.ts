import { Renderer } from "./render.ts";
import { DragZone, Zone } from "./drag_zone.ts";
import { Column, Id, Task, UiEvent } from "./models.ts";
import { Dragging } from "./dragging.ts";
import { Client } from "./client.ts";

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

    private async deleteTaskEvent(event: UiEvent & { "type": "delete" }) {
        await (new Client()).removeTask();
        const task = this.findTask({
            column: event.column,
            task: event.task,
        }, null);
        if (!task) {
            throw new Error(
                "unreachable: cannot delete already deleted task",
            );
        }
        task.peers.splice(task.index, 1);
        this.newSession();
    }

    private findTask(
        options: { column: Id; task: Id },
        tasks: Task[] | null,
    ): { index: number; peers: Task[] } | null {
        if (!tasks) {
            const column = this.state.find((v) => v.id === options.column);
            if (!column) {
                throw new Error(
                    "unreachable: cannot find a deleted column",
                );
            }
            return this.findTask(options, column.children);
        }
        const task = tasks.findIndex((task) => task.id === options.task);
        if (task !== -1) {
            return { index: task, peers: tasks };
        }

        return tasks
            .map((v) => this.findTask(options, v.children))
            .find((v) => v !== null) ?? null;
    }

    private findAndMoveTask(zone: Zone, oldTask: { column: Id; task: Id }) {
        const movingTask = this.findTask({
            column: oldTask.column,
            task: oldTask.task,
        }, null);
        if (!movingTask) {
            throw new Error(
                "unreachable: cannot move non-existant task",
            );
        }
        const [task] = movingTask.peers.splice(movingTask.index, 1);
        if (zone.parent.type === "column") {
            const parent = this.state.find((v) => v.id === zone.parent.id);
            if (!parent) {
                throw new Error(
                    "unreachable: cannot move into non-existant column",
                );
            }
            parent.children.splice(zone.index, 0, task);
        } else if (zone.parent.type === "task") {
            const parent = this.findTask({
                column: zone.parent.column,
                task: zone.parent.id,
            }, null);
            if (!parent) {
                throw new Error(
                    "unreachable: cannot move into non-existant task",
                );
            }
            parent.peers[parent.index].children.splice(zone.index, 0, task);
        }

        this.newSession();
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

    private async addTaskEvent(event: UiEvent & { "type": "add" }) {
        const task = this.findTask(
            { column: event.column, task: event.task },
            null,
        );
        if (!task) {
            throw new Error(
                "unreachable: cannot add to deleted task",
            );
        }
        const content = prompt("Content of task?");
        if (!content) {
            return;
        }
        const id = await (new Client().addTask());
        task.peers[task.index].children.push({
            id: id,
            content,
            children: [],
        });
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

        const closest = this.dragZone.closestDragZone(position);
        const zone = this.dragZone.zoneFromId(closest);
        const { column, task } = this.dragging;
        this.dragZone.hideZones();
        this.dragging.destruct();
        this.dragging = null;

        this.findAndMoveTask(zone, {
            column,
            task,
        });
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
