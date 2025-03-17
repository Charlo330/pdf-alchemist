import { inject, injectable } from 'inversify';
import { App, Notice, TFile } from 'obsidian';

const TYPES = {
	App: Symbol.for("App"),
	FileService: Symbol.for("FileService"),
	NoteService: Symbol.for("NoteService"),
	SidebarService: Symbol.for("SidebarService"),
};

@injectable()
export class FileService {
	pdfFile : TFile | null = null;
	mdFile : TFile | null = null;

    constructor(
		@inject(TYPES.App)
		public app: App
	) {}

	async initialisePdfFile() {
		this.pdfFile = this.app.workspace.getActiveFile();
		if (!this.pdfFile || this.pdfFile.extension !== 'pdf') {
			new Notice('❌ Veuillez ouvrir un fichier PDF');
			this.pdfFile = null;
		}
		this.initialiseMdFile();
	}

	async initialiseMdFile() {
		// TODO gérer avec setting
		if (!this.pdfFile) return;
		this.mdFile = await this.app.vault.getAbstractFileByPath(`${this.pdfFile?.basename}.md`) as TFile;
		
		if (!this.mdFile) {
			this.mdFile = await this.app.vault.create(`${this.pdfFile?.basename}.md`, '');
		}
	}

	getMdFile() {
		return this.mdFile;
	}
	getPdfFile() {
		return this.pdfFile;
	}
}
