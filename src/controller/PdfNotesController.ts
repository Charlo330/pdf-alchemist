import { inject, injectable } from "inversify";
import { App, Notice, TAbstractFile, TFile } from "obsidian";
import { TYPES } from "src/type/types";
import { PdfNotesService } from "src/Service/PdfNotesService";
import { StateManager } from "src/StateManager";
import { BrokenLinkModal } from "src/view/BrokenLinkModal";
import { FileLinkService } from "src/Service/FileLinkService";

@injectable()
export class PdfNotesController {
	deletePdfLink(pdfPath: string) {
		throw new Error("Method not implemented.");
	}
	constructor(
		@inject(TYPES.PdfNotesService) private pdfNotesService: PdfNotesService,
		@inject(TYPES.StateManager) private stateManager: StateManager,
		@inject(TYPES.App) private app: App,
		@inject(TYPES.FileLinkService) private fileLinkService: FileLinkService
	) {}

	async onPdfFileChanged(file: TFile | null): Promise<void> {
		if (!file || file.extension !== "pdf") {
			this.stateManager.setCurrentPdf(null);
			return;
		}
		const existingLink = await this.fileLinkService.getLinkedNotePath(
			file?.path || ""
		);

		const settings = this.stateManager.getSettings();

		if (!existingLink && settings.autoCreateNotes) {
			await this.pdfNotesService.createNoteFile(
				file.path,
				file.basename,
				settings.isPageMode
			);
		} else if (!existingLink && !settings.autoCreateNotes) {
			// Show a modal to inform the user
			new BrokenLinkModal(this.app, this, file.path).open();
			this.stateManager.setCurrentPdf(null);
			await this.pdfNotesService.onPdfChanged();
			return;
		}
		this.stateManager.setCurrentPdf(file);
		this.stateManager.setIsPageMode(existingLink?.isPageMode || null);
		await this.pdfNotesService.onPdfChanged();
	}

	async createNoteFileByCurrentPdfOpened(isPageMode: boolean): Promise<boolean> {
		const pdf = this.app.workspace.getActiveFile();
		if (!pdf || pdf.extension !== "pdf") {
			new Notice("No PDF file is currently open.");
			return false;
		}
		await this.pdfNotesService.createNoteFile(pdf.path, pdf.basename, isPageMode);
		this.stateManager.setCurrentPdf(pdf);
		this.stateManager.setIsPageMode(isPageMode);
		return true;
	}

	async onPageChanged(page: number): Promise<void> {
		this.stateManager.setCurrentPage(page);
	}

	async saveNote(content: string): Promise<void> {
		const state = this.stateManager.getState();

		if (state.isInSubNote) {
			return;
		}
		if (!state.currentPdf) return;

		if (!state.isPageMode) {
			const pdfPath = state.currentPdf.path;
			if (!pdfPath) {
				new Notice("No PDF file is currently open.");
				return;
			}

			const linkedNote = await this.fileLinkService.getLinkedNotePath(
				pdfPath
			);

			console.log("linkedNote", linkedNote);

			this.pdfNotesService.saveNoteByFilePath(linkedNote?.notePath || "", content);
		} else {
			await this.pdfNotesService.saveNoteByPage(content);
		}
	}

	async getNoteContent(): Promise<string> {
		const state = this.stateManager.getState();
		if (!state.currentPdf) return "";

		const pdf = this.stateManager.getCurrentPdf();
		console.log("pageMode", state.isPageMode);

		if (!pdf) {
			return "";
		}

		const linkedNote = await this.fileLinkService.getLinkedNotePath(pdf.path);

		if (pdf && !linkedNote) {
			return "";
		}

		if (pdf && this.stateManager.getIsPageMode()) {
			try {
				const note = await this.pdfNotesService.getNotesForPage(
					state.currentPage
				);
				return note || "";
			} catch (error) {
				console.warn("Failed to get note for current page:", error);

				new BrokenLinkModal(this.app, this, pdf.path).open();
				this.stateManager.setCurrentPdf(null);
			}
		} else if (pdf && !this.stateManager.getIsPageMode()) {
			return await this.pdfNotesService.getNotesContent(linkedNote?.notePath || "");
		}
		return "";
	}

	async linkPdfToNote(
		pdfPath: string,
		notePath: string,
		isPageMode: boolean
	): Promise<void> {
		await this.fileLinkService.linkPdfToNote(pdfPath, notePath, isPageMode);
		new Notice(`PDF linked to note: ${notePath}`);
	}

	async deleteLink(file: TFile | null): Promise<void> {
		if (!file) {
			return;
		}

		if (file.extension === "pdf") {
			await this.fileLinkService.deletePdfLink(file.path);
			new Notice(`Link to PDF deleted: ${file.path}`);
		} else if (file.extension === "md") {
			const pdfPath = await this.fileLinkService.getLinkedPdfPath(
				file.path
			);
			console.log("pdfPath", pdfPath);
			if (pdfPath) {
				await this.fileLinkService.deleteNoteLink(file.path);
				new Notice(`Link to note deleted: ${file.path}`);
			} else {
				new Notice(`No linked PDF found for note: ${file.path}`);
			}
		}
	}

	getFile(filePath: string): TFile | null {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			return file;
		}
		return null;
	}

	async getLinkedNotePath(pdfPath: string): Promise<string | null> {
		const linkedNote = await this.fileLinkService.getLinkedNotePath(pdfPath);
		return linkedNote?.notePath || null;
	}

	async getLinkedPdfPath(notePath: string): Promise<string | null> {
		const linkedNote = await this.fileLinkService.getLinkedPdfPath(notePath);
		return linkedNote?.pdfPath || null;
	}

	async updateFilesPath(file: TAbstractFile, oldPath: string) {
		if (file instanceof TFile) {
			if (file.extension === "pdf") {
				this.fileLinkService.updatePdfPath(oldPath, file.path);
				this.pdfNotesService.onPdfChanged();
			} else if (file.extension === "md") {
				this.fileLinkService.updateNotePath(oldPath, file.path);
			}
		}
	}

	getSettings() {
		return this.stateManager.getSettings();
	}
}
