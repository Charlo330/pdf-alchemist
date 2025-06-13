import { inject, injectable } from "inversify";
import { App, Notice, TFile } from "obsidian";

const TYPES = {
	App: Symbol.for("App"),
	FileService: Symbol.for("FileService"),
	NoteService: Symbol.for("NoteService"),
	SidebarService: Symbol.for("SidebarService"),
};

@injectable()
export class FileService {
	pdfFile: TFile | null = null;
	mdFile: TFile | null = null;

	constructor(
		@inject(TYPES.App)
		public app: App
	) {}

	async changePdfFile(file: TFile | null) {
		console.log("FileService changePdfFile", file);
		this.pdfFile = file;
		if (!this.pdfFile || this.pdfFile.extension !== "pdf") {
			this.pdfFile = null;
			return;
		}
		await this.initialiseMdFile();
	}

	async initialiseMdFile(filename = "") {
		// TODO gérer avec setting
		if (filename) {
			this.mdFile = this.app.metadataCache.getFirstLinkpathDest(
				filename,
				""
			);
			return;
		}
		if (!this.pdfFile) return;
		this.mdFile = (await this.app.vault.getAbstractFileByPath(
			`${this.pdfFile?.basename}.md`
		)) as TFile;

		if (!this.mdFile) {
			this.mdFile = await this.app.vault.create(
				`${this.pdfFile?.basename}.md`,
				""
			);
		}
	}

	async readMdFile() : Promise<string> {

		if (!this.mdFile) {
			new Notice("No markdown file to read.");
			return "";
		}
		const content = await this.app.vault.read(this.mdFile);
		return content;
	}

	isPdfFileOpened() {
		return this.pdfFile?.extension == "pdf";
	}

	getMdFile() {
		return this.mdFile;
	}
	getMdFilePath() {
		return this.mdFile ? this.mdFile.path : "";
	}
	getPdfFile() {
		return this.pdfFile;
	}
}
