import { hashBoard } from "bsm";
import {
    BoardData,
    BoardPreview,
    BoardRequest,
    CreateBoardRequest,
    DeleteBoardRequest,
    ExecuteActionRequest,
    Id,
    Storage,
    StorageError,
    Success,
} from "./storage.ts";

function makeId(): Id {
    return { inner: crypto.randomUUID() };
}

type StoredBoardData = BoardData & { cachedTitle: string };

export class LocalStorage implements Storage {
    private getBoardData(): StoredBoardData[] {
        return JSON.parse(localStorage.getItem("boards") ?? "[]");
    }

    private setBoardData(data: StoredBoardData[]) {
        return localStorage.setItem("boards", JSON.stringify(data));
    }

    async createBoard(
        req: CreateBoardRequest,
    ): Promise<(Success & { board: BoardPreview }) | StorageError> {
        const id = makeId();
        const board: StoredBoardData = {
            id,
            initialTitle: req.title,
            cachedTitle: req.title,
            actions: [],
        };
        const boardData = this.getBoardData();
        boardData.push(board);
        this.setBoardData(boardData);
        return await Promise.resolve({
            ok: true,
            message: "success",
            board: { id, title: req.title },
        });
    }
    async boards(): Promise<
        (Success & { boards: BoardPreview[] }) | StorageError
    > {
        const boards = this.getBoardData().map((v) => ({
            title: v.cachedTitle,
            id: v.id,
        }));
        return await Promise.resolve({ ok: true, boards, message: "success" });
    }
    async board(
        req: BoardRequest,
    ): Promise<(Success & { board: BoardData }) | StorageError> {
        const board = this.getBoardData().find((v) =>
            v.id.inner === req.board.inner
        );
        if (board === undefined) {
            return await Promise.resolve({ ok: false, message: "invalid id" });
        }
        return await Promise.resolve({ ok: true, board, message: "success" });
    }
    async executeAction(
        req: ExecuteActionRequest,
    ): Promise<Success | StorageError> {
        const boardData = this.getBoardData();
        const board = boardData.find((v) => v.id.inner === req.board.inner);
        if (board === undefined) {
            return { ok: false, message: "invalid id" };
        }

        const serverHash = await hashBoard(board.initialTitle, [
            ...board.actions,
            req.action,
        ]);

        if (serverHash !== req.hash) {
            return { ok: false, message: "invalid board hash" };
        }

        board.actions.push(req.action);
        if (req.action.tag === "edit_board") {
            board.cachedTitle = req.action.title;
        }

        this.setBoardData(boardData);

        return { ok: true, message: "success" };
    }
    async deleteBoard(
        req: DeleteBoardRequest,
    ): Promise<Success | StorageError> {
        const boardData = this.getBoardData();
        const board = boardData.findIndex((v) =>
            v.id.inner === req.board.inner
        );
        if (board === -1) {
            return await Promise.resolve({ ok: false, message: "invalid id" });
        }
        boardData.splice(board, 1);
        this.setBoardData(boardData);
        return await Promise.resolve({ ok: true, message: "success" });
    }
}
