import { inject, injectable } from "inversify";
import { App, TFile } from "obsidian";
import { StateManager } from "src/StateManager";
import type { ILinkRepository } from "src/type/ILinkRepository";
import { PdfNoteLink } from "src/type/PdfNoteLink";
import { TYPES } from "src/type/types";

@injectable()
export class FileLinkService {
	constructor(
		@inject(TYPES.LinkRepository) private linkRepo: ILinkRepository,
		@inject(TYPES.StateManager) private stateManager: StateManager,
		@inject(TYPES.App) private app: App
	) {}

	async linkPdfToNote(pdfPath: string, notePath: string, isPageMode: boolean): Promise<void> {
		const link: PdfNoteLink = { pdfPath: pdfPath, notePath: notePath, isPageMode: isPageMode };
		await this.linkRepo.save(link);
	}

	async getLinkedNoteFile(): Promise<TFile | null> {
		const pdfPath = this.stateManager.getCurrentPdf()?.path;
		console.log("pdfPath", pdfPath);
		const link = await this.linkRepo.findByPdf(pdfPath ? pdfPath : "");

		const filepath = this.app.vault.getFileByPath(link?.notePath || "");

		return filepath || null;
	}

	async getLinkedNotePath(pdfPath: string): Promise<PdfNoteLink | null> {
		const link = await this.linkRepo.findByPdf(pdfPath);
		return link || null;
	}

	async getLinkedPdfPath(notePath: string): Promise<PdfNoteLink | null> {
		const link = await this.linkRepo.findByNote(notePath);
		return link || null;
	}

	async updatePdfPath(oldPath: string, newPath: string): Promise<void> {
		await this.linkRepo.updatePdfPath(oldPath, newPath);
	}

	async updateNotePath(oldPath: string, newPath: string): Promise<void> {
		await this.linkRepo.updateNotePath(oldPath, newPath);
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
}
