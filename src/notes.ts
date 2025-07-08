import { App, TFile } from "obsidian";
import { FileService } from "./file";
import { inject, injectable } from "inversify";

const TYPES = {
	App: Symbol.for("App"),
	FileService: Symbol.for("FileService"),
	NoteService: Symbol.for("NoteService"),
};

injectable();
export class NoteService {
	notes: { [fileName: string]: { [page: number]: string } } = {};
	private currentPage = 1;
	private inSubNote = false;

	constructor(
		@inject(TYPES.App)
		public app: App,
		@inject(TYPES.FileService)
		public fileService: FileService
	) {}

	getSavedNotes(page: number): string | undefined {
		const fileName = this.fileService.getPdfFile()?.basename;
		if (!fileName) return "";
		return this.notes[fileName]?.[page] ? this.notes[fileName]?.[page] : "";
	}

	getInSubNote() {
		return this.inSubNote;
	}

	setInSubNote(inSubNote: boolean) {
		this.inSubNote = inSubNote;
	}

	async saveNotes(page: number, content: string) {
		const pdfFile = this.fileService.getPdfFile();
		console.log("pdfFile", pdfFile);

		if (!pdfFile) return;
		console.log("test");
		let notesFile;
		let notesContent = "";

		if (this.inSubNote) {
			notesFile = this.fileService.getMdFile();
			notesContent = content;
		} else {
			console.log("alloooooo", this.notes);
			if (!this.notes[pdfFile.basename]) {
				this.notes[pdfFile.basename] = {};
			}

			this.notes[pdfFile.basename][page] = content;
			console.log("Notes after saving:", this.notes);
			// Sauvegarde dans un fichier Markdown
			notesFile = this.fileService.getMdFile();

			// TODO ajouter settings pour delimiter
			for (const [pageNum, text] of Object.entries(
				this.notes[pdfFile.basename]
			)) {
				notesContent += `## Page ${pageNum}\n${text}\n\n`;
			}
		}

		if (!notesFile) {
			// TODO ajouter setting pour le path de création du fichier.
			notesFile = await this.app.vault.create(notesPath, notesContent);
		} else {
			await this.app.vault.modify(notesFile, notesContent);
		}
	}

	async loadNotesFromFile() {
		const pdfFile = this.fileService.getPdfFile();
		console.log("Loading notes for PDF file:", pdfFile?.path);
		if (!pdfFile) return;

		if (pdfFile.extension !== "pdf") {
			return;
		}

		const noteFile = this.fileService.getMdFile();

		//const notesFile = await this.app.vault.getAbstractFileByPath(notesPath) as TFile;

		if (noteFile) {
			const content = await this.app.vault.read(noteFile);
			console.log("Content loaded from note file:", content);
			const fileName = noteFile.basename;

			if (!content && this.notes[fileName]) {
				this.notes[fileName] = {};
				return;
			}

			const loadedNotes = this.parseMarkdownNotes(content, fileName);
			console.log("Parsed notes:", loadedNotes);

			// Fusionner les nouvelles notes avec celles déjà en mémoire
			if (!this.notes[fileName]) {
				this.notes[fileName] = {};
			}
			this.notes[fileName] = Object.assign(this.notes[fileName], loadedNotes);
		}
	}

	async openPdfInCenter(app: App, pdfFile: TFile) {
		const centralLeaf = app.workspace.getMostRecentLeaf(); // centre ou actif
		if (centralLeaf) {
			await centralLeaf.openFile(pdfFile);
		} else {
			// fallback, si aucune leaf existante
			const newLeaf = app.workspace.getLeaf(false);
			await newLeaf.openFile(pdfFile);
		}
	}

	parseMarkdownNotes(
		content: string,
		fileName: string
	): { [page: number]: string } {
		const notes: { [page: number]: string } = {};
		const matches = content.matchAll(
			/## Page (\d+)\n([\s\S]*?)(?=\n## Page \d+|\n?$)/g
		);

		for (const match of matches) {
			const pageNum = parseInt(match[1], 10);
			notes[pageNum] = match[2].trim();
		}

		return notes;
	}

	async refresh() {
		await this.fileService.initialiseMdFile();
		await this.loadNotesFromFile();
	}

	getCurrentPage() {
		return this.currentPage;
	}

	setCurrentPage(page: number) {
		this.currentPage = page;
	}

	getFileName() {
		if (!this.fileService.getPdfFile()) {
			return "";
		}
		return this.fileService.getPdfFile()?.basename;
	}
}
