import * as bsm from "bsm";

export type Id = {
    inner: string;
};

export type BoardData = {
    id: Id;
    initialTitle: string;
    actions: bsm.Action[];
};

export type BoardPreview = {
    id: Id;
    title: string;
};

export type CreateBoardRequest = {
    title: string;
};

export type DeleteBoardRequest = {
    board: Id;
};

export type BoardRequest = {
    board: Id;
};

export type ExecuteActionRequest = {
    board: Id;
    hash: string;
    action: bsm.Action;
};

export type StorageError = {
    ok: false;
    message: string;
};

export type Success = {
    ok: true;
    message: "success";
};

export interface Storage {
    createBoard(
        req: CreateBoardRequest,
    ): Promise<(Success & { board: BoardPreview }) | StorageError>;
    boards(): Promise<(Success & { boards: BoardPreview[] }) | StorageError>;
    board(req: BoardRequest): Promise<
        | (Success & { board: BoardData })
        | StorageError
    >;
    executeAction(
        req: ExecuteActionRequest,
    ): Promise<Success | StorageError>;
    deleteBoard(req: DeleteBoardRequest): Promise<Success | StorageError>;
}
