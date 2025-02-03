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
        document.body.classList.add("ghost-dragging");
    }

    destruct() {
        this.ghost.remove();
        document.body.classList.remove("ghost-dragging");
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
