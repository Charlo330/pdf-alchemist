import { inject, injectable } from "inversify";
import { App, normalizePath, Notice } from "obsidian";
import { FileLinkService } from "src/Service/FileLinkService";
import { PdfNotesService } from "src/Service/PdfNotesService";
import { StateManager } from "src/StateManager";
import { TYPES } from "src/type/types";

@injectable()
export class SubNotesController {
	constructor(
		@inject(TYPES.PdfNotesService) private pdfNotesService: PdfNotesService,
		@inject(TYPES.StateManager) private stateManager: StateManager,
		@inject(TYPES.FileLinkService) private fileLinkService: FileLinkService,
		@inject(TYPES.App) private app: App
	) {}

	async saveSubNote(content: string): Promise<void> {
		const state = this.stateManager.getState();
		if (!state.isInSubNote) {
			new Notice("You are not in a sub-note.");
			return;
		}
		const subNotePath = this.stateManager.peekNavigationStack();
		if (!subNotePath) {
			new Notice("No sub-note path found.");
			return;
		}
		await this.pdfNotesService.saveSubNote(content);
	}

	async openSubNote(fileName: string): Promise<void> {
		let subNotePath = await this.app.metadataCache.getFirstLinkpathDest(
			fileName,
			""
		)?.path;
		console.log("subNotePath", subNotePath);

		if (!subNotePath) {

			const linkedNote = await this.fileLinkService.getLinkedNoteFile();

			const folderPath = linkedNote?.path.substring(0, linkedNote.path.lastIndexOf("/"));

			const newFilePath = normalizePath(`${folderPath}/${fileName}.md`);

			subNotePath = await this.pdfNotesService.createSubNoteFile(
				newFilePath
			);
		}

		if (subNotePath) {
			this.stateManager.pushToNavigationStack(subNotePath);
		} else {
			new Notice(`Failed to create sub-note for: ${fileName}`);
		}
	}

	async getSubNoteContent(): Promise<string> {
		return await this.pdfNotesService.getSubNoteContent();
	}

	getSubNoteFileName(): string | null {
		const subNotePath = this.stateManager.peekNavigationStack();
		if (!subNotePath) {
			return null;
		}
		return subNotePath.split("/").pop()?.split(".")[0] || null;
	}

	previousSubNote(): void {
		this.pdfNotesService.previousSubNote();
	}

	mainNote(): void {
		this.pdfNotesService.mainNote();
	}
}
