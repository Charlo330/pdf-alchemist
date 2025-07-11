import { App, Modal } from "obsidian";
import { FileTypeEnum, FolderSuggest } from "./FolderSuggest"; // ou FileSuggest si adapté
import { FileService } from "./file";

export class FilePickerModal extends Modal {
	plugin: any; // ton plugin
	fileService: FileService; // service de gestion des fichiers

	constructor(app: App, plugin: any, fileService: FileService) {
		super(app);
		this.plugin = plugin;
		this.fileService = fileService;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const h2 = contentEl.createEl("h2", {
			text: "Repair PDF Markdown Link",
		});
		h2.style.textAlign = "center";

		const inputContainer = contentEl.createDiv({
			cls: "file-picker-input",
		});
		const inputElem1 = inputContainer.createEl("input", {
			type: "text",
			placeholder: "PDF File Name",
			cls: "file-picker-input-field",
		});

		const inputElem2 = inputContainer.createEl("input", {
			type: "text",
			placeholder: "MD File Name",
			cls: "file-picker-input-field",
		});

		new FolderSuggest(this.app, inputElem1, FileTypeEnum.PDF);

		new FolderSuggest(this.app, inputElem2, FileTypeEnum.MARKDOWN);

		const btn = inputContainer.createEl("button", { text: "Validate" });
		btn.onclick = () => {
			if (inputElem1.value && inputElem2.value) {
				this.linkFiles(inputElem1.value, inputElem2.value);
				console.log("tout est beau");
				this.close();
			}
		};
	}


	linkFiles(pdfFilepath: string, mdFilepath: string) {
		this.fileService.pdfNoteLinker?.linkPdfToNote(pdfFilepath, mdFilepath);
	}

	onClose() {
		this.contentEl.empty();
	}
}
