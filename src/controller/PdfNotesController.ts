import { inject, injectable } from "inversify";
import { App, Notice, TAbstractFile, TFile } from "obsidian";
import { TYPES } from "src/type/types";
import { PdfNotesService } from "src/Service/PdfNotesService";
import { StateManager } from "src/StateManager";
import { BrokenLinkModal } from "src/view/BrokenLinkModal";
import { FileLinkService } from "src/Service/FileLinkService";
import {
	relativeFolderPath,
	rootfilePath,
	sameFolderPath,
	folderPath,
} from "src/utils/filePath";

@injectable()
export class PdfNotesController {
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

		const autoCreateNotes = this.stateManager.getSettings().autoCreateNotes;

		if (!existingLink && autoCreateNotes) {
			await this.createNoteFile(file.path, file.basename);
		} else if (!existingLink && !autoCreateNotes) {
			new BrokenLinkModal(this.app, this, file.path).open();
			this.stateManager.setCurrentPdf(null);
			return;
		}
		this.stateManager.setCurrentPdf(file);
		await this.pdfNotesService.onPdfChanged();
	}

	async createNoteFileIfNotExists(): Promise<boolean> {
		const pdf = this.app.workspace.getActiveFile();
		if (!pdf || pdf.extension !== "pdf") {
			new Notice("No PDF file is currently open.");
			return false;
		}
		if (!pdf) {
			new Notice("No PDF file is currently open.");
			return false;
		}
		if (!pdf.basename) {
			new Notice("No PDF file is currently open.");
			return false;
		}
		await this.createNoteFile(pdf.path, pdf.basename);
		this.stateManager.setCurrentPdf(pdf);
		return true;
	}

	private async createNoteFile(
		pdfPath: string,
		basename: string
	): Promise<void> {
		const folderLocation =
			this.stateManager.getSettings().folderLocationPath;
		let filePath = null;
		switch (this.stateManager.getSettings().folderLocation) {
			case "root":
				filePath = rootfilePath(basename);
				break;
			case "folder":
				filePath = folderPath(folderLocation || "", basename);
				break;
			case "sameFolder":
				filePath = sameFolderPath(pdfPath || "", basename);
				break;
			case "relativeFolder":
				filePath = relativeFolderPath(pdfPath || "", folderLocation);

				filePath = await this.pdfNotesService.createFolderIfNotExists(
					filePath
				);

				filePath = folderPath(pdfPath, basename);
				break;
			default:
				filePath = sameFolderPath(pdfPath || "", basename);
				break;
		}

		filePath = await this.pdfNotesService.createNoteFileIfNotExists(
			filePath
		);
		await this.linkPdfToNote(pdfPath || "", filePath);
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

		await this.pdfNotesService.saveNote(content);
	}

	async getNoteForCurrentPage(): Promise<string> {
		const state = this.stateManager.getState();
		if (!state.currentPdf) return "";

		const pdf = this.stateManager.getCurrentPdf();

		if (pdf && (await this.fileLinkService.getLinkedNotePath(pdf.path))) {
			try {
				const note = await this.pdfNotesService.getNotesForPage(
					state.currentPage
				);
				return note || "";
			} catch (error) {
				console.warn("Failed to get note for current page:", error);

				new Notice(
					"Failed to retrieve note for current page. Please check the console for details."
				);
				// affiche la modal lien brisé
				this.stateManager.setCurrentPdf(null);
			}
		}
		return "";
	}

	async linkPdfToNote(pdfPath: string, notePath: string): Promise<void> {
		await this.fileLinkService.linkPdfToNote(pdfPath, notePath);
		new Notice(`PDF linked to note: ${notePath}`);
	}

	async deleteLink(file: TFile): Promise<void> {
		if (file.extension === "pdf") {
			await this.fileLinkService.deletePdfLink(file.path);
			new Notice(`Link to PDF deleted: ${file.path}`);
		} else if (file.extension === "md") {
			const pdfPath = await this.fileLinkService.getLinkedPdfPath(
				file.path
			);
			if (pdfPath) {
				await this.fileLinkService.deleteNoteLink(file.path);
				new Notice(`Link to note deleted: ${file.path}`);
			} else {
				new Notice(`No linked PDF found for note: ${file.path}`);
			}
		}
	}

	async getLinkedNotePath(pdfPath: string): Promise<string | null> {
		return await this.fileLinkService.getLinkedNotePath(pdfPath);
	}

	async getLinkedPdfPath(notePath: string): Promise<string | null> {
		return await this.fileLinkService.getLinkedPdfPath(notePath);
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

	getCurrentPdfFile(): TFile | null {
		for (const leaf of this.app.workspace.getLeavesOfType("pdf")) {
			const view = leaf.view as any;
			if (view && view.file?.extension === "pdf") {
				return view.file;
			}
		}
		return null;
	}
}
