import { Board } from "./board.ts";
import * as dummyData from "./dummy_data.ts";
import { Editor } from "./editor.ts";

function main() {
    const boardElem = document.querySelector<HTMLElement>("#board");
    const editorDivElem = document.querySelector<HTMLDivElement>("#editor");
    if (!boardElem || !editorDivElem) {
        throw new Error("unreachable");
    }
    const editor = new Editor(editorDivElem);
    editor.init();
    new Board({
        element: boardElem,
        initialState: [
            dummyData.column(),
            dummyData.column(),
            dummyData.column(),
        ],
        editor,
    });
}

main();
