import * as bsm from "bsm";
import { BoardData, BoardPreview, Db, Id, makeId } from "./db.ts";
import { err, ok, Result } from "@result/result";
export class MemDb implements Db {
    boardData: BoardData[];

    constructor() {
        this.boardData = [];
    }

    createBoard(initialTitle: string): Result<BoardPreview, string> {
        const id = makeId();
        this.boardData.push({
            id,
            initialTitle,
            cachedTitle: initialTitle,
            actions: [],
        });
        return ok({ id, title: initialTitle });
    }
    commitAction(board: Id, action: bsm.Action): Result<void, string> {
        const found = this.boardData.find((v) => v.id.inner === board.inner);
        if (!found) {
            return err("invalid board id");
        }
        found.actions.push(action);
        if (action.tag === "edit_board") {
            found.cachedTitle = action.title;
        }
        return ok();
    }
    boards(): BoardPreview[] {
        return this.boardData.map(({ id, cachedTitle }) => ({
            id,
            title: cachedTitle,
        }));
    }
    retrieveBoardData(board: Id): Result<BoardData, string> {
        const found = this.boardData.find((v) => v.id.inner === board.inner);
        if (!found) {
            return err("invalid board id");
        }
        return ok(found);
    }
    deleteBoard(board: Id): Result<void, string> {
        const found = this.boardData.findIndex((v) =>
            v.id.inner === board.inner
        );
        if (found === -1) {
            return err("invalid board id");
        }
        this.boardData.splice(found, 1);
        return ok();
    }
}
