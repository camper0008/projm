import { BoardPreview, Storage } from "./storage.ts";

function createButton(icon: string, tooltip: string): HTMLElement {
    const button = document.createElement("button");
    button.classList.add("boards-list-button");
    const iconElement = document.createElement("span");
    iconElement.classList.add("material-symbols-outlined");
    iconElement.textContent = icon;
    button.append(iconElement);
    button.title = tooltip;
    button.style.cursor = "pointer";
    return button;
}

function createBoardItem(board: BoardPreview): HTMLElement {
    const container = document.createElement("li");
    container.classList.add("boards-list-item");
    const text = document.createElement("a");
    text.innerText = board.title;
    text.href = `?board=${board.id.inner}`;
    text.classList.add("boards-list-text");
    container.append(text);
    return container;
}

export function renderBoardsPage(boards: BoardPreview[], storage: Storage) {
    const container = document.querySelector<HTMLElement>("#content");
    if (!container) {
        throw new Error("unreachable: defined in index.html");
    }

    const title = document.createElement("h1");
    title.textContent = "Boards";
    title.classList.add("boards-page-title");
    const ul = document.createElement("ul");
    ul.classList.add("boards-list");
    const children = boards.map(createBoardItem);

    const toolbar = document.createElement("li");
    toolbar.classList.add("boards-list-toolbar");
    const createBoardButton = createButton("add_circle", "Create new board");
    createBoardButton.addEventListener("click", async () => {
        const title = prompt("Board title?");
        if (!title) {
            return;
        }
        const res = await storage.createBoard({ title });
        if (!res.ok) {
            return alert(`An error occurred creating board: ${res.message}`);
        }
        ul.append(createBoardItem(res.board));
    });
    toolbar.append(createBoardButton);

    ul.append(...children);
    container.append(title, ul, toolbar);
}
