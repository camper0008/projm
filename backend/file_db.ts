import * as bsm from "bsm";
import { BoardData, BoardPreview, Db, Id, makeId } from "./db.ts";
import { err, ok, Result } from "@result/result";

type StoredBoardData = BoardData & { cachedTitle: string };

export class FileDb implements Db {
    private constructor() {
    }

    private async delete(id: Id): Promise<true | null> {
        try {
            await Deno.remove(`stored_boards/${id.inner}`);
            return true;
        } catch (err) {
            if (!(err instanceof Deno.errors.NotFound)) {
                throw err;
            }
            return null;
        }
    }
    private async readFromFileName(
        filename: string,
    ): Promise<StoredBoardData | null> {
        try {
            return await Deno.readTextFile(`stored_boards/${filename}`).then((
                v,
            ) => JSON.parse(v) as StoredBoardData);
        } catch (err) {
            if (!(err instanceof Deno.errors.NotFound)) {
                throw err;
            }
            return null;
        }
    }
    private async read(id: Id): Promise<StoredBoardData | null> {
        try {
            return await Deno.readTextFile(`stored_boards/${id.inner}`).then((
                v,
            ) => JSON.parse(v) as StoredBoardData);
        } catch (err) {
            if (!(err instanceof Deno.errors.NotFound)) {
                throw err;
            }
            return null;
        }
    }
    private async write(id: Id, content: StoredBoardData) {
        await Deno.writeTextFile(
            `stored_boards/${id.inner}`,
            JSON.stringify(content),
        );
    }

    async new() {
        try {
            await Deno.mkdir("stored_boards");
        } catch (err) {
            if (!(err instanceof Deno.errors.AlreadyExists)) {
                throw err;
            }
        }
    }

    async createBoard(
        initialTitle: string,
    ): Promise<Result<BoardPreview, string>> {
        const id = makeId();
        await this.write(id, {
            id,
            initialTitle,
            cachedTitle: initialTitle,
            actions: [],
        });
        return ok({ id, title: initialTitle });
    }
    async commitAction(
        board: Id,
        action: bsm.Action,
    ): Promise<Result<void, string>> {
        const found = await this.read(board);
        if (!found) {
            return err("invalid board id");
        }
        found.actions.push(action);
        if (action.tag === "edit_board") {
            found.cachedTitle = action.title;
        }
        await this.write(board, found);
        return ok();
    }

    async boards(): Promise<Result<BoardPreview[], string>> {
        const boards: BoardPreview[] = [];
        for await (const file of Deno.readDir("stored_boards")) {
            const board = await this.readFromFileName(file.name);
            if (!board) {
                return err("server occurred getting boards");
            }
            boards.push({ id: board.id, title: board.cachedTitle });
        }
        return ok(boards);
    }
    async retrieveBoardData(board: Id): Promise<Result<BoardData, string>> {
        const found = await this.read(board);
        if (!found) {
            return err("invalid board id");
        }
        return ok(found);
    }
    async deleteBoard(board: Id): Promise<Result<void, string>> {
        const deleted = await this.delete(board);
        if (!deleted) {
            return err("invalid board id");
        }
        return ok();
    }
}
