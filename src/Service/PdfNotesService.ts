import { injectable, inject } from "inversify";
import { App, TFile } from "obsidian";
import { NoteRepository } from "src/Repository/NoteRepository";
import { TYPES } from "src/type/types";
import { StateManager } from "src/StateManager";
import { normalize } from "path";
import { rootfilePath, folderPath, sameFolderPath, relativeFolderPath } from "src/utils/filePath";
import { FileLinkService } from "./FileLinkService";

@injectable()
export class PdfNotesService {
	private isInitialized = false;

	constructor(
		@inject(TYPES.NoteRepository) private noteRepo: NoteRepository,
		@inject(TYPES.FileLinkService) private fileLinkService: FileLinkService,
		@inject(TYPES.StateManager) private stateManager: StateManager,
		@inject(TYPES.App) private app: App
	) {}

	private async ensureInitialized(): Promise<void> {
		if (!this.isInitialized) {
			await this.noteRepo.initialize();
			this.isInitialized = true;
		}
	}

	async getNotesForPage(page: number): Promise<string | null> {
		await this.ensureInitialized();
		return await this.noteRepo.findByPage(page);
	}

	async getSubNoteContent() : Promise<string> {
		const state = this.stateManager.getState();
		if (!state.isInSubNote) return "";

		const subNotePath = this.stateManager.peekNavigationStack();
		console.log("subNotePath", subNotePath);
		if (!subNotePath) return "";

		return await this.noteRepo.findSubNoteContent(subNotePath);
	}

	async getNotesContent(filePath: string) {
		return await this.noteRepo.findSubNoteContent(filePath)
	}

	async saveNoteByPage(content: string): Promise<void> {
		await this.ensureInitialized();
		const pdfPath = this.stateManager.getCurrentPdf()?.path;
		console.log("pdfPath", pdfPath);
		const page = this.stateManager.getCurrentPage();
		if (pdfPath) {
			console.log("Saving note for PDF:", pdfPath, "Page:", page, "Content:", content);
			await this.noteRepo.save(pdfPath, page, content);
		}
	}

	async saveNoteByFilePath(filePath: string, content: string): Promise<void> {
		await this.noteRepo.saveToFilePath(filePath, content);
	}

	async saveSubNote(content: string): Promise<void> {
		const subNotePath = this.stateManager.peekNavigationStack();
		if (!subNotePath) {
			throw new Error("No sub-note path found in navigation stack.");
		}

		await this.noteRepo.saveToFilePath(subNotePath, content);
	}

	previousSubNote(): void {
		this.stateManager.popFromNavigationStack();
	}

	mainNote(): void {
		this.stateManager.getState().navigationStack = [];
		this.stateManager.setInSubNote(false);
	}

	async createFileIfNotExists(filepath: string): Promise<TFile | null> {

		if (!(await this.app.vault.adapter.exists(filepath))) {
			return await this.app.vault.create(filepath, "");
		}

		return null;
	}

	async createFolderIfNotExists(folderPath: string): Promise<string> {
		const normalizedPath = normalize(folderPath);
		let folder = this.app.vault.getAbstractFileByPath(normalizedPath);
		console.log("Creating folder if not exists:", folder);
		// TODO MODAL POUR TRY CATCH SI ON PEUT PAS CREER LE FOLDER
		if (!folder) {
			folder = await this.app.vault.createFolder(normalizedPath);
		}
		return folder.path;
	}

		async createNoteByCurrentPdfOpened(isPageMode: boolean): Promise<TFile | null> {
			const pdf = this.app.workspace.getActiveFile();
			if (!pdf || pdf.extension !== "pdf") {
				return null;
			}
			if (!pdf) {
				return null;
			}
			if (!pdf.basename) {
				return null;
			}
			return await this.createNoteFile(pdf.path, pdf.basename, isPageMode);
		}
	
		async createNoteFile(
			pdfPath: string,
			basename: string,
			isPageMode: boolean
		): Promise<TFile | null> {
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
	
					filePath = await this.createFolderIfNotExists(
						filePath
					);
	
					filePath = folderPath(filePath, basename);
					break;
				default:
					filePath = sameFolderPath(pdfPath || "", basename);
					break;
			}
	
			const file = await this.createFileIfNotExists(
				filePath
			);
			await this.fileLinkService.linkPdfToNote(pdfPath || "", filePath, isPageMode);
			return file;
		}

	async createSubNoteFile(filePath: string): Promise<string> {
		await this.app.vault.create(filePath, "");
		return filePath;
	}

	// Call this when PDF changes to reset initialization
	async onPdfChanged(): Promise<void> {
		this.isInitialized = false;
	}
}
