import {
    BoardData,
    BoardPreview,
    BoardRequest,
    CreateBoardRequest,
    DeleteBoardRequest,
    ExecuteActionRequest,
    Storage,
    StorageError,
    Success,
} from "./storage.ts";

export class BackendStorage implements Storage {
    private apiHost: string;

    constructor(apiUrl: string) {
        this.apiHost = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
    }

    apiUrl(endpoint: string): string {
        return `${this.apiHost}${endpoint}`;
    }

    async createBoard(
        req: CreateBoardRequest,
    ): Promise<(Success & { board: BoardPreview }) | StorageError> {
        return await fetch(this.apiUrl("/create_board"), {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify(req),
        })
            .then((res) => res.json());
    }
    async boards(): Promise<
        (Success & { boards: BoardPreview[] }) | StorageError
    > {
        return await fetch(this.apiUrl("/boards"), {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
        })
            .then((res) => res.json());
    }
    async board(
        req: BoardRequest,
    ): Promise<(Success & { board: BoardData }) | StorageError> {
        return await fetch(this.apiUrl("/board"), {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify(req),
        })
            .then((res) => res.json());
    }
    async executeAction(
        req: ExecuteActionRequest,
    ): Promise<Success | StorageError> {
        return await fetch(this.apiUrl("/execute_action"), {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify(req),
        })
            .then((res) => res.json());
    }
    async deleteBoard(
        req: DeleteBoardRequest,
    ): Promise<Success | StorageError> {
        return await fetch(this.apiUrl("/delete_board"), {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify(req),
        })
            .then((res) => res.json());
    }
}
