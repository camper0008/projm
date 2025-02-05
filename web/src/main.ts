import { Board, Id, makeBoard } from "bsm";
import { DragZone } from "./drag_zone.ts";
import { Renderer } from "./render.ts";
import { execute } from "bsm";
import { Action } from "bsm";
import { UiEvent, UiEventHandler } from "./ui_event.ts";

class DragSession {
    eventHandler: UiEventHandler;
    dragZone: DragZone;
    ref: HTMLElement;
    ghost: HTMLElement;

    task: Id;

    domEventController: AbortController;

    constructor(
        { dragZone, ref, eventHandler, initialPosition, task }: {
            ref: HTMLElement;
            dragZone: DragZone;
            eventHandler: UiEventHandler;
            task: Id;
            initialPosition: [number, number];
        },
    ) {
        this.dragZone = dragZone;
        this.ref = ref;
        this.task = task;
        this.ghost = this.ghostify(initialPosition);
        this.eventHandler = eventHandler;

        this.dragZone.markHtmlDragStatus(this.ref, { beingDragged: true });
        this.dragZone.showZones();
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
        const closest = this.dragZone.closestDragZone(
            [event.x, event.y],
            { refCenter: this.refCenter() },
        );
        this.dispose();
        if (closest === null) {
            return;
        }
        const position = this.dragZone.zoneFromId(closest).position;
        this.eventHandler({
            tag: "drag_end",
            position,
            task: this.task,
        });
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

        const closest = this.dragZone.closestDragZone(
            [event.x, event.y],
            { refCenter: this.refCenter() },
        );
        closest !== null
            ? this.dragZone.highlightZone(closest)
            : this.dragZone.removeHighlight();
    }

    dispose() {
        this.dragZone.markHtmlDragStatus(this.ref, { beingDragged: false });
        this.dragZone.hideZones();
        this.ghost.remove();
        document.body.classList.remove("dragging-object");
        this.domEventController.abort();
    }
}

function handleEvent(board: Board, dragZone: DragZone, event: UiEvent) {
    switch (event.tag) {
        case "add_column": {
            const title = prompt("Title of column?");
            if (!title) {
                break;
            }
            const action: Action = {
                tag: "add_column",
                title,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "add_task": {
            const content = prompt("Content of task?");
            if (!content) {
                break;
            }
            const action: Action = {
                tag: "add_task",
                content,
                parent: event.parent,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "remove_board": {
            break;
        }
        case "remove_column": {
            const action: Action = {
                tag: "remove_column",
                target: event.target,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "remove_task": {
            const action: Action = {
                tag: "remove_task",
                target: event.target,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "edit_board": {
            const title = prompt("New title?", event.oldTitle);
            if (!title) {
                break;
            }
            const action: Action = {
                tag: "edit_board",
                title,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "edit_column": {
            const title = prompt("New title?", event.oldTitle);
            if (!title) {
                break;
            }
            const action: Action = {
                tag: "edit_column",
                title,
                target: event.target,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "edit_task": {
            const content = prompt("New content?", event.oldContent);
            if (!content) {
                break;
            }
            const action: Action = {
                tag: "edit_task",
                content,
                target: event.target,
            };
            execute({ board, action });
            render(board);
            break;
        }
        case "drag_start": {
            new DragSession({
                dragZone,
                ref: event.ref,
                eventHandler: (event: UiEvent) =>
                    handleEvent(board, dragZone, event),
                initialPosition: event.position,
                task: event.task,
            });
            break;
        }
        case "drag_end": {
            const action: Action = {
                tag: "move_task",
                src: event.task,
                dest: event.position,
            };
            execute({ board, action });
            render(board);
            break;
        }
    }
}

function render(board: Board) {
    const dragZone = new DragZone();
    const renderer = new Renderer({
        dragZone,
        eventHandler: (event) => handleEvent(board, dragZone, event),
    });
    const element = document.querySelector<HTMLElement>("#board");
    if (!element) {
        throw new Error("unreachable");
    }
    element.replaceChildren(...renderer.render_content(board));
}

function main() {
    const board = makeBoard("cool board");
    render(board);
}

main();
