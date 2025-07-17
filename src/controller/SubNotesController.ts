import { inject, injectable } from "inversify";
import { App, Notice } from "obsidian";
import { PdfNotesService } from "src/Service/PdfNotesService";
import { StateManager } from "src/StateManager";
import { TYPES } from "src/type/types";

@injectable()
export class SubNotesController {
	constructor(
		@inject(TYPES.PdfNotesService) private pdfNotesService: PdfNotesService,
		@inject(TYPES.StateManager) private stateManager: StateManager,
		@inject(TYPES.App) private app: App
	) {}

	async saveSubNote(content: string): Promise<void> {
		const state = this.stateManager.getState();
		if (!state.currentPdf) return;
		if (state.isInSubNote) {
			await this.pdfNotesService.saveNote(content);
		} else {
			new Notice("You are not in a sub-note context.");
		}
	}

	async openSubNote(fileName: string): Promise<void> {
		const subNotePath =
			await this.pdfNotesService.createSubNoteFileIfNotExists(fileName);

		if (subNotePath) {
			this.stateManager.setInSubNote(true);
		} else {
			new Notice(`Failed to create sub-note for: ${fileName}`);
		}

		this.stateManager.pushToNavigationStack(subNotePath);
	}

	async getSubNoteContent(): Promise<string> {
		return await this.pdfNotesService.getSubNoteContent();
	}
}
