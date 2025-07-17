import { injectable, inject } from "inversify";
import { PdfNoteLink } from "src/type/PdfNoteLink";
import type { ILinkRepository } from "src/type/ILinkRepository";
import { App, TFile } from "obsidian";
import { NoteRepository } from "src/Repository/NoteRepository";
import { TYPES } from "src/type/types";
import { StateManager } from "src/StateManager";

@injectable()
export class PdfNotesService {
	private isInitialized = false;

	constructor(
		@inject(TYPES.NoteRepository) private noteRepo: NoteRepository,
		@inject(TYPES.LinkRepository) private linkRepo: ILinkRepository,
		@inject(TYPES.StateManager) private stateManager: StateManager,
		@inject(TYPES.App) private app: App
	) {}

	private async ensureInitialized(): Promise<void> {
		if (!this.isInitialized) {
			await this.noteRepo.initialize();
			this.isInitialized = true;
		}
	}

	async linkPdfToNote(pdfPath: string, notePath: string): Promise<void> {
		const link: PdfNoteLink = { pdfPath, notePath };
		await this.linkRepo.save(link);
	}

	async getNotesForPage(page: number): Promise<string | null> {
		await this.ensureInitialized();
		return await this.noteRepo.findByPage(page);
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

	async getLinkedNoteFile(): Promise<TFile | null> {
		const pdfPath = this.stateManager.getCurrentPdf()?.path;
		console.log("pdfPath", pdfPath);
		const link = await this.linkRepo.findByPdf(pdfPath ? pdfPath : "");

		const filepath = this.app.vault.getFileByPath(link?.notePath || "");

		return filepath || null;
	}

	async getLinkedNotePath(pdfPath: string): Promise<string | null> {
		const link = await this.linkRepo.findByPdf(pdfPath);
		return link?.notePath || null;
	}

	async getLinkedPdfPath(notePath: string): Promise<string | null> {
		const link = await this.linkRepo.findByNote(notePath);
		return link?.pdfPath || null;
	}

	async createNoteFileIfNotExists(file: TFile): Promise<string> {
		const existingLink = await this.linkRepo.findByPdf(file?.path || "");
		if (existingLink) {
			return existingLink.notePath;
		}

		const notePath = file?.path.replace(/\.pdf$/, ".md") || "";	

		if (!(await this.app.vault.adapter.exists(notePath))) {
			// TODO: Use settings.noteTemplate when available
			await this.app.vault.create(notePath, "");
		}

		await this.linkPdfToNote(file?.path || "", notePath);
		return notePath;
	}

	async updatePdfPath(oldPath: string, newPath: string): Promise<void> {
		await this.linkRepo.updatePdfPath(oldPath, newPath);
		// Reset initialization flag to force re-initialization with new path
		this.isInitialized = false;
	}

	async updateNotePath(oldPath: string, newPath: string): Promise<void> {
		await this.linkRepo.updateNotePath(oldPath, newPath);
		// Reset initialization flag to force re-initialization with new path
		this.isInitialized = false;
	}

	async deletePdfLink(pdfPath: string): Promise<void> {
		await this.linkRepo.delete(pdfPath);
	}

	async deleteNoteLink(notePath: string): Promise<void> {
		const link = await this.linkRepo.findByNote(notePath);
		if (link) {
			await this.linkRepo.delete(link.pdfPath);
		}
	}

	// Call this when PDF changes to reset initialization
	async onPdfChanged(): Promise<void> {
		this.isInitialized = false;
	}
}
