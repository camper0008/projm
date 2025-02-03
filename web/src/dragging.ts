import { Id } from "./models.ts";

interface DraggingOptions {
    position: [number, number];
    ref: HTMLElement;
    column: Id;
    task: Id;
}

export class Dragging {
    private ref: HTMLElement;
    private ghost: HTMLElement;
    public readonly column: Id;
    public readonly task: Id;

    constructor({ position, ref, column, task }: DraggingOptions) {
        this.ref = ref;
        this.ref.classList.add("being-dragged");
        this.ghost = this.clone(this.ref);
        this.column = column;
        this.task = task;
        document.body.classList.add("dragging-object");
        this.moveGhost(position);
    }

    destruct() {
        this.ghost.remove();
        this.ref.classList.remove("being-dragged");
        document.body.classList.remove("dragging-object");
    }

    moveGhost([x, y]: [number, number]) {
        this.ghost.style.left = `${x}px`;
        this.ghost.style.top = `${y}px`;
    }

    private clone(element: HTMLElement): HTMLElement {
        const clone = document.createElement("div");
        clone.innerHTML = element.innerHTML;
        clone.style.backgroundColor = element.style.backgroundColor;
        clone.classList.add("task", "ghost");
        document.body.append(clone);
        return clone;
    }
}
