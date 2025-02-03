import { Renderer } from "./render.ts";
import { DragZone } from "./drag_zone.ts";
import { Column, UiEvent } from "./models.ts";
import { Dragging } from "./dragging.ts";

export interface BoardOptions {
    element: HTMLElement;
    initialState: Column[];
}

export class Board {
    private element: HTMLElement;
    private state: Column[];
    private dragZone!: DragZone;
    private dragging: Dragging | null;

    constructor({ element, initialState }: BoardOptions) {
        this.state = initialState;
        this.element = element;
        this.dragging = null;
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

    private handleUiEvent(event: UiEvent) {
        switch (event.type) {
            case "drag_start":
                console.log(this);
                console.log("handleuievent: this.dragging is", this.dragging);
                if (this.dragging !== null) {
                    throw new Error(
                        "unreachable: began new dragging session without cleaning up old dragging session",
                    );
                }
                this.dragging = new Dragging({ ...event });
                break;
            case "add":
                break;
            case "delete":
                break;
        }
    }

    private mouseUp(position: [number, number]) {
        console.log("mouseup: this.dragging is", this.dragging);
        if (this.dragging === null) {
            return;
        }

        this.dragZone.closestDragZone(position);
        /* move drag or summin */
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
        this.dragZone = new DragZone();
        const renderer = new Renderer({
            eventHandler: this.handleUiEvent,
            dragZone: this.dragZone,
        });
        this.element.replaceChildren(...renderer.render(this.state));
    }
}
