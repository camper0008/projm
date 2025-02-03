import { Board } from "./board.ts";
import * as dummyData from "./dummy_data.ts";

function main() {
    const element = document.querySelector<HTMLElement>("#board");
    if (!element) {
        throw new Error("unreachable");
    }
    new Board({
        element,
        initialState: [
            dummyData.column(),
            dummyData.column(),
            dummyData.column(),
        ],
    });
}

main();
