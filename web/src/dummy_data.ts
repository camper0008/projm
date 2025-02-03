import { Column } from "./models.ts";

function id(): string {
    return crypto.randomUUID();
}

export function column(): Column {
    return {
        id: id(),
        title: "column 1",
        children: [{
            id: id(),
            content: "test 1",
            children: [
                {
                    id: id(),
                    content: "test 2",
                    children: [
                        { id: id(), content: "test 3", children: [] },
                        { id: id(), content: "test 4", children: [] },
                    ],
                },
                {
                    id: id(),
                    content: "test 5",
                    children: [
                        {
                            id: id(),
                            content: "test 6",
                            children: [],
                        },
                        {
                            id: id(),
                            content: "test 7",
                            children: [],
                        },
                    ],
                },
            ],
        }, {
            id: id(),
            content: "test 1",
            children: [
                {
                    id: id(),
                    content: "test 2",
                    children: [
                        { id: id(), content: "test 3", children: [] },
                        { id: id(), content: "test 4", children: [] },
                    ],
                },
                {
                    id: id(),
                    content: "test 5",
                    children: [
                        {
                            id: id(),
                            content: "test 6",
                            children: [],
                        },
                        {
                            id: id(),
                            content: "test 7",
                            children: [],
                        },
                    ],
                },
            ],
        }],
    };
}
