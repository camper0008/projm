import * as bsm from "bsm";
import { BoardData, BoardPreview, Db, Id, makeId } from "./db.ts";
import { err, ok, Result } from "@result/result";

type StoredBoardData = BoardData & { cachedTitle: string };

function resolve<T>(t: T): Promise<T> {
    return Promise.resolve(t);
}

export class MemDb implements Db {
    boardData: StoredBoardData[];

    constructor() {
        this.boardData = [];
    }

    createBoard(initialTitle: string): Promise<Result<BoardPreview, string>> {
        const id = makeId();
        this.boardData.push({
            id,
            initialTitle,
            cachedTitle: initialTitle,
            actions: [],
        });
        return resolve(ok({ id, title: initialTitle }));
    }
    commitAction(board: Id, action: bsm.Action): Promise<Result<void, string>> {
        const found = this.boardData.find((v) => v.id.inner === board.inner);
        if (!found) {
            return resolve(err("invalid board id"));
        }
        found.actions.push(action);
        if (action.tag === "edit_board") {
            found.cachedTitle = action.title;
        }
        return resolve(ok());
    }
    boards(): Promise<Result<BoardPreview[], string>> {
        return resolve(ok(this.boardData.map(({ id, cachedTitle }) => ({
            id,
            title: cachedTitle,
        }))));
    }
    retrieveBoardData(board: Id): Promise<Result<BoardData, string>> {
        const found = this.boardData.find((v) => v.id.inner === board.inner);
        if (!found) {
            return resolve(err("invalid board id"));
        }
        return resolve(ok(found));
    }
    deleteBoard(board: Id): Promise<Result<void, string>> {
        const found = this.boardData.findIndex((v) =>
            v.id.inner === board.inner
        );
        if (found === -1) {
            return resolve(err("invalid board id"));
        }
        this.boardData.splice(found, 1);
        return resolve(ok());
    }
}
