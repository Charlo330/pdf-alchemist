import { inject, injectable } from "inversify";
import { App, Notice } from "obsidian";
import { FileLinkService } from "src/Service/FileLinkService";
import { PdfNotesService } from "src/Service/PdfNotesService";
import { StateManager } from "src/StateManager";
import { TYPES } from "src/type/types";
import { container } from "src/container";
import { FilePickerModalFactory } from "src/container";

@injectable()
export class BrokenLinkModalController {
	constructor(
		@inject(TYPES.App) private app: App,
		@inject(TYPES.FileLinkService) private fileLinkService: FileLinkService,
		@inject(TYPES.PdfNotesService) private pdfNotesService: PdfNotesService,
		@inject(TYPES.StateManager) private stateManager: StateManager
	) {}

	async getLinkedNotePath(pdfPath: string): Promise<string | null> {
		const linkedNote = await this.fileLinkService.getLinkedNotePath(
			pdfPath
		);
		return linkedNote?.notePath || null;
	}

	async createNoteFileByCurrentPdfOpened(
		isPageMode: boolean
	): Promise<boolean> {
		const pdf = this.app.workspace.getActiveFile();
		if (!pdf || pdf.extension !== "pdf") {
			new Notice("No PDF file is currently open.");
			return false;
		}
		await this.pdfNotesService.createNoteFile(
			pdf.path,
			pdf.basename,
			isPageMode
		);
		this.stateManager.setIsPageMode(isPageMode);
		this.stateManager.setCurrentPdf(pdf);
		return true;
	}

	async createFilePickerModalView(path: string): Promise<void> {
		const factory = container.get<FilePickerModalFactory>(TYPES.FilePickerModalFactory);
		const modal = factory(path);
		modal.open();
	}

	isPageModeEnabled(): boolean {
		return this.stateManager.getSettings().isPageMode;
	}
}
