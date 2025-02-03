import { Id } from "./models.ts";

interface DraggingOptions {
    ref: HTMLElement;
    column: Id;
    task: Id;
}

export class Dragging {
    private ghost: HTMLElement;
    public readonly column: Id;
    public readonly task: Id;

    constructor({ ref, column, task }: DraggingOptions) {
        this.ghost = this.clone(ref);
        this.column = column;
        this.task = task;
    }

    destruct() {
        this.ghost.remove();
    }

    moveGhost([x, y]: [number, number]) {
        this.ghost.style.x = `${x}px`;
        this.ghost.style.y = `${y}px`;
    }

    private clone(element: HTMLElement): HTMLElement {
        const clone = document.createElement("div");
        clone.outerHTML = element.outerHTML;
        clone.classList.add("ghost");
        return clone;
    }
}
