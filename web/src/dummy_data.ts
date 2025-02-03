import { Column } from "./models.ts";
import { fakeId } from "./id.ts";

export function column(): Column {
    return {
        id: fakeId(),
        title: "column 1",
        children: [{
            id: fakeId(),
            content: "test 1",
            children: [
                {
                    id: fakeId(),
                    content: "test 2",
                    children: [
                        { id: fakeId(), content: "test 3", children: [] },
                        { id: fakeId(), content: "test 4", children: [] },
                    ],
                },
                {
                    id: fakeId(),
                    content: "test 5",
                    children: [
                        {
                            id: fakeId(),
                            content: "test 6",
                            children: [],
                        },
                        {
                            id: fakeId(),
                            content: "test 7",
                            children: [],
                        },
                    ],
                },
            ],
        }, {
            id: fakeId(),
            content: "test 1",
            children: [
                {
                    id: fakeId(),
                    content: "test 2",
                    children: [
                        { id: fakeId(), content: "test 3", children: [] },
                        { id: fakeId(), content: "test 4", children: [] },
                    ],
                },
                {
                    id: fakeId(),
                    content: "test 5",
                    children: [
                        {
                            id: fakeId(),
                            content: "test 6",
                            children: [],
                        },
                        {
                            id: fakeId(),
                            content: "test 7",
                            children: [],
                        },
                    ],
                },
            ],
        }],
    };
}
