import { Id } from "bsm";
import { DragZoner } from "./drag_zoner.ts";
import { UiEventHandler } from "./ui_event.ts";

type DragSubject =
    | {
        tag: "task";
        id: Id;
        initialPosition: [number, number];
        ref: HTMLElement;
    }
    | {
        tag: "column";
        id: Id;
        initialPosition: [number, number];
        ref: HTMLElement;
    };

export class DragSession {
    eventHandler: UiEventHandler;
    dragZoner: DragZoner;
    ref: HTMLElement;
    ghost: HTMLElement;

    subject: { tag: DragSubject["tag"]; id: Id };

    domEventController: AbortController;

    constructor(
        { dragZoner, eventHandler, subject }: {
            dragZoner: DragZoner;
            eventHandler: UiEventHandler;
            subject: DragSubject;
        },
    ) {
        this.dragZoner = dragZoner;
        this.ref = subject.ref;
        this.subject = { ...subject };
        this.ghost = this.ghostify(subject.initialPosition);
        this.eventHandler = eventHandler;

        this.dragZoner.markHtmlDragStatus(this.ref, { beingDragged: true });
        this.dragZoner.showZones(subject.tag);
        document.body.classList.add("dragging-object");

        this.domEventController = new AbortController();

        addEventListener(
            "mousemove",
            (ev) => this.mouseMove(ev),
            { signal: this.domEventController.signal },
        );
        addEventListener("mouseup", (ev) => this.mouseUp(ev), {
            signal: this.domEventController.signal,
        });
    }

    private ghostify([x, y]: [number, number]) {
        const ghost = document.createElement("div");
        ghost.innerHTML = this.ref.innerHTML;
        ghost.style.top = `${y}px`;
        ghost.style.left = `${x}px`;
        ghost.style.backgroundColor = this.ref.style.backgroundColor;
        ghost.className = this.ref.className;
        ghost.classList.add("ghost");
        document.body.append(ghost);
        return ghost;
    }

    private mouseUp(event: MouseEvent) {
        const closest = this.dragZoner.closestDragZone(
            [event.x, event.y],
            { refCenter: this.refCenter() },
        );
        this.dispose();
        if (closest === null) {
            return;
        }
        const zone = this.dragZoner.zoneFromId(closest);
        if (zone.tag !== this.subject.tag) {
            throw new Error("unreachable: hidden drag zone marked as closest");
        }
        if (zone.tag === "task") {
            this.eventHandler({
                tag: "task_drag_end",
                position: zone.position,
                task: this.subject.id,
            });
        } else {
            this.eventHandler({
                tag: "column_drag_end",
                position: zone.position,
                column: this.subject.id,
            });
        }
    }
    private refCenter(): [number, number] {
        const refBounds = this.ref.getBoundingClientRect();
        const refCenter: [number, number] = [
            refBounds.left + refBounds.width * 0.5,
            refBounds.top + refBounds.height * 0.5,
        ];
        return refCenter;
    }
    private mouseMove(event: MouseEvent) {
        this.ghost.style.top = `${event.y}px`;
        this.ghost.style.left = `${event.x}px`;

        const closest = this.dragZoner.closestDragZone(
            [event.x, event.y],
            { refCenter: this.refCenter() },
        );
        closest !== null
            ? this.dragZoner.highlightZone(closest)
            : this.dragZoner.removeHighlights();
    }

    dispose() {
        this.dragZoner.markHtmlDragStatus(this.ref, { beingDragged: false });
        this.dragZoner.hideZones();
        this.ghost.remove();
        document.body.classList.remove("dragging-object");
        this.domEventController.abort();
    }
}
