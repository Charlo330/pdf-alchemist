import { injectable, inject } from "inversify";
import { PdfNoteLink } from "src/type/PdfNoteLink";
import type { ILinkRepository } from "src/type/ILinkRepository";
import { App, TFile } from "obsidian";
import type { AppState } from "src/type/AppState";
import { NoteRepository } from "src/Repository/NoteRepository";
import { TYPES } from "src/container";

@injectable()
export class PdfNotesService {
	constructor(
		@inject(TYPES.NoteRepository) private noteRepo: NoteRepository,
		@inject(TYPES.LinkRepository) private linkRepo: ILinkRepository,
		@inject(TYPES.StateManager) private stateManager: AppState,
		@inject(TYPES.App) private app: App
	) {}

	async linkPdfToNote(pdfPath: string, notePath: string): Promise<void> {
		const link: PdfNoteLink = { pdfPath, notePath };
		await this.linkRepo.save(link);
	}

	async getNotesForPage(page: number): Promise<string | null> {
		return await this.noteRepo.findByPage(page);
	}

	async saveNote(): Promise<void> {
		await this.noteRepo.save();
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

	// good
	async createNoteFileIfNotExists(): Promise<string> {
		const pdf = this.stateManager.currentPdf;
		const existingLink = await this.linkRepo.findByPdf(pdf?.path || "");
		if (existingLink) {
			return existingLink.notePath;
		}

		const notePath =
			pdf?.path.replace(/\.pdf$/, ".md") || "";	

		if (!(await this.app.vault.adapter.exists(notePath))) {
			// TODO
			//await this.app.vault.create(notePath, settings.noteTemplate);
			await this.app.vault.create(notePath, "");
		}

		await this.linkPdfToNote(pdf?.path || "", notePath);
		return notePath;
	}

	async updatePdfPath(oldPath: string, newPath: string): Promise<void> {
		await this.linkRepo.updatePdfPath(oldPath, newPath);
	}

	async updateNotePath(oldPath: string, newPath: string): Promise<void> {
		await this.linkRepo.updateNotePath(oldPath, newPath);
	}
}
