export class Editor {
    private createHandler?: (text: string) => void;
    private cancelHandler?: () => void;

    private setTitleInputText!: (text: string) => void;
    private focusTitleInput!: () => void;
    private setEditorMode!: (type: "create" | "edit") => void;

    public constructor(
        private elem: HTMLDivElement,
    ) {}

    public init() {
        const boxTitle = document.createElement("h2");
        boxTitle.textContent = "Create new task...";

        const titleInput = document.createElement("input");
        titleInput.placeholder = "...";

        this.setTitleInputText = (text) => {
            titleInput.value = text;
        };
        this.focusTitleInput = () => {
            titleInput.focus();
        };

        titleInput.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" && titleInput.value !== "") {
                this.createHandler?.(titleInput.value);
            }
            if (ev.key === "Escape") {
                this.cancelHandler?.();
            }
        });

        const toolbarDiv = document.createElement("div");
        toolbarDiv.classList.add("editor-toolbar");

        const [createButton, createIcon] = this.taskToolbarButton(
            "add",
            "Add task",
        );
        createButton.addEventListener("mousedown", () => {
            if (titleInput.value !== "") {
                this.createHandler?.(titleInput.value);
            }
        });

        const [cancelButton, _cancelIcon] = this.taskToolbarButton(
            "close",
            "Cancel",
        );
        cancelButton.addEventListener("mousedown", () => {
            this.cancelHandler?.();
        });

        this.setEditorMode = (type) => {
            switch (type) {
                case "create":
                    boxTitle.textContent = "Create task";
                    createIcon.textContent = "add";
                    break;
                case "edit":
                    boxTitle.textContent = "Edit task";
                    createIcon.textContent = "save";
                    break;
            }
        };

        toolbarDiv.append(createButton, cancelButton);

        this.elem.append(boxTitle, titleInput, toolbarDiv);

        this.hide();
    }

    public create(): Promise<string | undefined> {
        this.setTitleInputText("");
        this.setEditorMode("create");
        return this.activateEditor();
    }

    public edit(original: string): Promise<string | undefined> {
        this.setTitleInputText(original);
        this.setEditorMode("edit");
        return this.activateEditor();
    }

    private activateEditor(): Promise<string | undefined> {
        this.show();
        this.focusTitleInput();
        return new Promise((resolve) => {
            const deactivateEditor = () => {
                this.hide();
                delete this.createHandler;
                delete this.cancelHandler;
            };
            this.createHandler = (newText) => {
                deactivateEditor();
                resolve(newText);
            };
            this.cancelHandler = () => {
                deactivateEditor();
                resolve(undefined);
            };
        });
    }

    private taskToolbarButton(
        icon: string,
        tooltip: string,
        cursor: string = "pointer",
    ): [HTMLElement, HTMLElement] {
        const button = document.createElement("button");
        button.classList.add("editor-toolbar-button");
        const iconElement = document.createElement("span");
        iconElement.classList.add("material-symbols-outlined");
        iconElement.textContent = icon;
        button.append(iconElement);
        button.title = tooltip;
        button.style.cursor = cursor;
        return [button, iconElement];
    }

    private hide() {
        this.elem.style.visibility = "hidden";
    }

    private show() {
        this.elem.style.visibility = "visible";
    }
}
