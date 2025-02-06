import * as bsm from "bsm";
import { Result } from "@result/result";

export type Id = {
    inner: string;
};

export function makeId(): Id {
    return {
        inner: crypto.randomUUID(),
    };
}

export type BoardData = {
    id: Id;
    initialTitle: string;
    actions: bsm.Action[];
};

export type BoardPreview = {
    id: Id;
    title: string;
};

export interface Db {
    createBoard(initialTitle: string): Result<BoardPreview, string>;
    commitAction(board: Id, action: bsm.Action): Result<void, string>;
    boards(): Result<BoardPreview[], string>;
    retrieveBoardData(board: Id): Result<BoardData, string>;
    deleteBoard(board: Id): Result<void, string>;
}
