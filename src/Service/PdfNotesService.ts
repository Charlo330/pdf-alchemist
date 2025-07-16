import { injectable, inject } from "inversify";
import { PdfNoteLink } from "src/type/PdfNoteLink";
import type { ILinkRepository } from "src/type/ILinkRepository";
import { App, TFile } from "obsidian";
import type { AppState } from "src/type/AppState";
import { NoteRepository } from "src/Repository/NoteRepository";
import { TYPES } from "src/container";

@injectable()
export class PdfNotesService {
	private noteRepo: NoteRepository;
	private isInitialized = false;

	constructor(
		@inject(TYPES.NoteRepository) noteRepo: NoteRepository,
		@inject(TYPES.LinkRepository) private linkRepo: ILinkRepository,
		@inject(TYPES.StateManager) private stateManager: AppState,
		@inject(TYPES.App) private app: App
	) {
		this.noteRepo = noteRepo;
	}

	private async ensureInitialized(): Promise<void> {
		if (!this.isInitialized) {
			const pdfPath = this.stateManager.currentPdf?.path;
			if (pdfPath) {
				await this.noteRepo.initialize(pdfPath);
				this.isInitialized = true;
			}
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

	async saveNote(): Promise<void> {
		await this.ensureInitialized();
		const pdfPath = this.stateManager.currentPdf;
		if (pdfPath) {
			await this.noteRepo.save(pdfPath);
		}
	}

	async getLinkedNoteFile(): Promise<TFile | null> {
		const pdfPath = this.stateManager.currentPdf?.path || "";
		const link = await this.linkRepo.findByPdf(pdfPath);

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

	async createNoteFileIfNotExists(): Promise<string> {
		const pdf = this.stateManager.currentPdf;
		const existingLink = await this.linkRepo.findByPdf(pdf?.path || "");
		if (existingLink) {
			return existingLink.notePath;
		}

		const notePath = pdf?.path.replace(/\.pdf$/, ".md") || "";	

		if (!(await this.app.vault.adapter.exists(notePath))) {
			// TODO: Use settings.noteTemplate when available
			await this.app.vault.create(notePath, "");
		}

		await this.linkPdfToNote(pdf?.path || "", notePath);
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

	// Call this when PDF changes to reset initialization
	async onPdfChanged(): Promise<void> {
		this.isInitialized = false;
	}
}
