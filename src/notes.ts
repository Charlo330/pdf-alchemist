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
	notes: { [fileName: string]: { [page: number]: string } } = {}; 
	private currentPage = 1;

	constructor(
		@inject(TYPES.App)
		public app: App, 
		@inject(TYPES.FileService)
		public fileService: FileService
	) {}

	getSavedNotes(page: number): string | undefined {
		const fileName = this.fileService.getPdfFile()?.basename;
		console.log('filename');
		console.log(fileName)
		if (!fileName) return '';
		console.log('notes');
		console.log(this.notes);
		return this.notes[fileName]?.[page] ? this.notes[fileName]?.[page] : '';
	}

	async saveNotes(page: number, content: string) {
		const pdfFile = this.fileService.getPdfFile();
		if (!pdfFile) return;
		console.log('content');

		this.notes[pdfFile.basename][page] = content;
		console.log(this.notes);


		// Sauvegarde dans un fichier Markdown
		const notesPath = `${pdfFile.basename}.md`;
		let notesFile = this.app.vault.getAbstractFileByPath(notesPath) as TFile;

		let notesContent = '';
		console.log(Object.entries(this.notes));
		for (const [pageNum, text] of Object.entries(this.notes[pdfFile.basename])) {
			notesContent += `## Page ${pageNum}\n${text}\n\n`;
		}

		if (!notesFile) {
			notesFile = await this.app.vault.create(notesPath, notesContent);
		} else {
			await this.app.vault.modify(notesFile, notesContent);
		}
	}

	async loadNotesFromFile() {
		console.log('LOAD NOTES');
		console.log(this.fileService);
	
		const pdfFile = this.fileService.getPdfFile();
		console.log(pdfFile);
		if (!pdfFile) return;
	
		const fileName = pdfFile.basename;
		const notesPath = `${fileName}.md`;
		console.log(notesPath);
	
		const notesFile = await this.app.vault.getAbstractFileByPath(notesPath) as TFile;
	
		if (notesFile) {
			const content = await this.app.vault.read(notesFile);
			const loadedNotes = this.parseMarkdownNotes(content, fileName);
	
			// Fusionner les nouvelles notes avec celles déjà en mémoire
			if (!this.notes[fileName]) {
				this.notes[fileName] = {};
			}
			Object.assign(this.notes[fileName], loadedNotes);
	
			console.log(this.notes);
		}
	}
	
	parseMarkdownNotes(content: string, fileName: string): { [page: number]: string } {
		const notes: { [page: number]: string } = {};
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
