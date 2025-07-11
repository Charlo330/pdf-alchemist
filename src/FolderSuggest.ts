import { AbstractInputSuggest, App } from "obsidian";

export enum FileTypeEnum {
	PDF = "pdf",
	MARKDOWN = "md",
}

export class FolderSuggest extends AbstractInputSuggest<string> {
    private folders: string[];
	private inputEl: HTMLInputElement;
	private fileType: FileTypeEnum;

    constructor(app: App, inputEl: HTMLInputElement, fileType: FileTypeEnum) {
        super(app, inputEl);
        // Get all folders and include root folder
        this.folders = ["/"].concat(this.app.vault.getFiles().map(folder => folder.path));
		this.inputEl = inputEl;
		this.fileType = fileType;
    }

    getSuggestions(inputStr: string): string[] {
        const inputLower = inputStr.toLowerCase();

		if (this.fileType === FileTypeEnum.PDF) {
			return this.folders.filter(folder => folder.toLowerCase().includes(inputLower) && folder.endsWith(".pdf"));
		} else if (this.fileType === FileTypeEnum.MARKDOWN) {
			return this.folders.filter(folder => folder.toLowerCase().includes(inputLower) && folder.endsWith(".md"));
		}

		else {
			return new Array<string>();
		}
    }

    renderSuggestion(folder: string, el: HTMLElement): void {
        el.createEl("div", { text: folder });
    }

    selectSuggestion(folder: string): void {
        this.inputEl.value = folder;
        const event = new Event('input');
        this.inputEl.dispatchEvent(event);
        this.close();
    }
}
