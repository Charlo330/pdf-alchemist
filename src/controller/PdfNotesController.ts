import { inject, injectable } from "inversify";
import { App, Notice, TAbstractFile, TFile } from "obsidian";
import { TYPES } from "src/type/types";
import { PdfNotesService } from "src/Service/PdfNotesService";
import { StateManager } from "src/StateManager";
import { BrokenLinkModal } from "src/view/BrokenLinkModal";
import { FileLinkService } from "src/Service/FileLinkService";

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
		let existingLink = await this.fileLinkService.getLinkedNotePath(
			file?.path || ""
		);

		if (!existingLink) {
			let filePath = file?.path.split("/").pop()?.split(".")[0] || "";
			filePath = filePath + "/" + file.basename + ".md";
			existingLink = await this.pdfNotesService.createSubNoteFile(
				filePath
			);
			await this.linkPdfToNote(file?.path || "", existingLink);
		}

		await this.pdfNotesService.onPdfChanged();
		this.stateManager.setCurrentPdf(file);
		// Notify the service that PDF has changed
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
				new BrokenLinkModal(this.app, this, pdf.path).open();
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
