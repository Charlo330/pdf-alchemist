import { AbstractInputSuggest, App } from "obsidian";

export enum FileTypeEnum {
	PDF = "pdf",
	MARKDOWN = "md",
	FOLDER = "folder",
}

export class FolderSuggest extends AbstractInputSuggest<string> {
    private folders: string[];
	private files: string[] = [];
	private inputEl: HTMLInputElement;
	private fileType: FileTypeEnum;

    constructor(app: App, inputEl: HTMLInputElement, fileType: FileTypeEnum) {
        super(app, inputEl);
        // Get all folders and include root folder
        this.files = ["/"].concat(this.app.vault.getFiles().map(folder => folder.path));
		this.folders = this.app.vault.getAllFolders().map(folder => folder.path);
		this.inputEl = inputEl;
		this.fileType = fileType;
    }

    getSuggestions(inputStr: string): string[] {
        const inputLower = inputStr.toLowerCase();

		if (this.fileType === FileTypeEnum.PDF) {
			return this.files.filter(folder => folder.toLowerCase().includes(inputLower) && folder.endsWith(".pdf"));
		} else if (this.fileType === FileTypeEnum.MARKDOWN) {
			return this.files.filter(folder => folder.toLowerCase().includes(inputLower) && folder.endsWith(".md"));
		} else if (this.fileType === FileTypeEnum.FOLDER) {
			return this.folders;
		} else {
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
