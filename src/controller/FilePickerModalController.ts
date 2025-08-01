import { inject, injectable } from "inversify";
import { App, Notice, TFile } from "obsidian";
import { FileLinkService } from "src/Service/FileLinkService";
import { TYPES } from "src/type/types";

@injectable()
export class FilePickerModalController {
	constructor(
		@inject(TYPES.App) private app: App,
		@inject(TYPES.FileLinkService) private fileLinkService: FileLinkService
	) {}

	async linkPdfToNote(pdfPath: string, notePath: string): Promise<void> {
		this
		await this.fileLinkService.linkPdfToNote(pdfPath, notePath);
		new Notice(`PDF linked to note: ${notePath}`);
	}

	getFile(filePath: string): TFile | null {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			return file;
		}
		return null;
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

	
}
