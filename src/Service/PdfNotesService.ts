import { injectable, inject } from "inversify";
import { App, TFile } from "obsidian";
import { NoteRepository } from "src/Repository/NoteRepository";
import { TYPES } from "src/type/types";
import { StateManager } from "src/StateManager";

@injectable()
export class PdfNotesService {
	private isInitialized = false;

	constructor(
		@inject(TYPES.NoteRepository) private noteRepo: NoteRepository,
		@inject(TYPES.StateManager) private stateManager: StateManager,
		@inject(TYPES.App) private app: App
	) {}

	private async ensureInitialized(): Promise<void> {
		if (!this.isInitialized) {
			await this.noteRepo.initialize();
			this.isInitialized = true;
		}
	}

	async getNotesForPage(page: number): Promise<string | null> {
		await this.ensureInitialized();
		return await this.noteRepo.findByPage(page);
	}

	async getSubNoteContent() : Promise<string> {
		const state = this.stateManager.getState();
		if (!state.isInSubNote) return "";

		const subNotePath = this.stateManager.peekNavigationStack();
		console.log("subNotePath", subNotePath);
		if (!subNotePath) return "";

		return await this.noteRepo.findSubNoteContent(subNotePath);
	}

	async saveNote(content: string): Promise<void> {
		await this.ensureInitialized();
		const pdfPath = this.stateManager.getCurrentPdf()?.path;
		console.log("pdfPath", pdfPath);
		const page = this.stateManager.getCurrentPage();
		if (pdfPath) {
			console.log("Saving note for PDF:", pdfPath, "Page:", page, "Content:", content);
			await this.noteRepo.save(pdfPath, page, content);
		}
	}

	async saveSubNote(content: string): Promise<void> {
		const subNotePath = this.stateManager.peekNavigationStack();
		if (!subNotePath) {
			throw new Error("No sub-note path found in navigation stack.");
		}

		await this.noteRepo.saveToFilePath(subNotePath, content);
	}

	previousSubNote(): void {
		this.stateManager.popFromNavigationStack();
	}

	mainNote(): void {
		this.stateManager.getState().navigationStack = [];
		this.stateManager.setInSubNote(false);
	}

	async createNoteFileIfNotExists(file: TFile): Promise<string> {
		const notePath = file?.path.replace(/\.pdf$/, ".md") || "";	

		if (!(await this.app.vault.adapter.exists(notePath))) {
			// TODO: Use settings.noteTemplate when available
			await this.app.vault.create(notePath, "");
		}

		return notePath;
	}

	async createSubNoteFile(filePath: string): Promise<string> {
		await this.app.vault.create(filePath, "");
		return filePath;
	}

	// Call this when PDF changes to reset initialization
	async onPdfChanged(): Promise<void> {
		this.isInitialized = false;
	}
}
