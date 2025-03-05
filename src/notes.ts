import { App, TFile } from 'obsidian';
import { FileService } from './file';
import { inject, injectable } from 'inversify';

const TYPES = {
	App: Symbol.for("App"),
	FileService: Symbol.for("FileService"),
	NoteService: Symbol.for("NoteService"),
};

injectable()
export class NoteService {
	notes: { [key: number]: string } = {}; // Stocke les notes par page
	private currentPage = 1;

	constructor(
		@inject(TYPES.App)
		public app: App, 
		@inject(TYPES.FileService)
		public fileService: FileService
	) {}

	getSavedNotes(page: number): string | undefined {
		return this.notes[page] || undefined;
	}

	async saveNotes(page: number, content: string) {
		const pdfFile = this.fileService.getPdfFile();
		if (!pdfFile) return;

		this.notes[page] = content;

		// Sauvegarde dans un fichier Markdown
		const notesPath = `${pdfFile.basename}.md`;
		let notesFile = this.app.vault.getAbstractFileByPath(notesPath) as TFile;

		let notesContent = '';
		for (const [pageNum, text] of Object.entries(this.notes)) {
			notesContent += `## Page ${pageNum}\n${text}\n\n`;
		}

		if (!notesFile) {
			notesFile = await this.app.vault.create(notesPath, notesContent);
		} else {
			await this.app.vault.modify(notesFile, notesContent);
		}
	}

	async loadNotesFromFile() {
		console.log('LOAD NOTES')
		console.log(this.fileService)
		const pdfFile = this.fileService.getPdfFile();
		console.log(pdfFile)
		if (!pdfFile) return;

		const notesPath = `${pdfFile.basename}.md`;
		console.log(notesPath)
		const notesFile = await this.app.vault.getAbstractFileByPath(notesPath) as TFile;

		if (notesFile) {
			const content = await this.app.vault.read(notesFile);
			this.notes = this.parseMarkdownNotes(content);
			console.log(this.notes)
		}
	}

	parseMarkdownNotes(content: string): { [key: number]: string } {
		const notes: { [key: number]: string } = {};
		const matches = content.matchAll(/## Page (\d+)\n([\s\S]*?)(?=\n## Page \d+|\n?$)/g);

		for (const match of matches) {
			const pageNum = parseInt(match[1], 10);
			notes[pageNum] = match[2].trim();
		}

		return notes;
	}

	getCurrentPage() {
		return this.currentPage;
	}

	setCurrentPage(page: number) {
		this.currentPage = page;
	}

	getFileName() {
		if (!this.fileService.getPdfFile()) {
			return '';
		}
		return this.fileService.getPdfFile()?.basename;
	}
}
