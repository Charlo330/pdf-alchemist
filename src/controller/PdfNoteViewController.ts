import { inject, injectable } from "inversify";
import {
	App,
	normalizePath,
	Notice,
	setIcon,
	TAbstractFile,
	TFile,
} from "obsidian";
import { FileLinkService } from "src/Service/FileLinkService";
import { PdfEventService } from "src/Service/PdfEventService";
import { PdfNotesService } from "src/Service/PdfNotesService";
import { StateManager } from "src/StateManager";
import { TYPES } from "src/type/types";
import { NoLinkedFileModalFactory, container } from "src/container";

@injectable()
export class PdfNoteViewController {
	private saveTimeout: NodeJS.Timeout | null = null;
	private readonly DEBOUNCE_DELAY = 500; // 500 milliseconds

	constructor(
		@inject(TYPES.App) private app: App,
		@inject(TYPES.StateManager) private stateManager: StateManager,
		@inject(TYPES.PdfEventService) private pdfEventService: PdfEventService,
		@inject(TYPES.FileLinkService) private fileLinkService: FileLinkService,
		@inject(TYPES.PdfNotesService) private pdfNotesService: PdfNotesService
	) {}

	getPageModeIcon(): string {
		if (this.stateManager.getIsPageMode()) {
			return "file-stack";
		} else {
			return "file";
		}
	}

	startListeningToPageChange(currentFile: TFile) {
		if (currentFile.extension !== "pdf") {
			return;
		}

		this.pdfEventService.registerPageChangeListener(
			currentFile,
			(pageNumber) => {
				this.stateManager.setCurrentPage(pageNumber);
			}
		);
	}

	cleanupPageChangeListener() {
		this.pdfEventService.cleanup();
	}

	async debouncedSave(content: string): Promise<void> {
		// Clear existing timeout
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
		}

		// Set new timeout
		this.saveTimeout = setTimeout(async () => {
			console.log("Saving note content...");
			try {
				if (this.stateManager.getState().isInSubNote) {
					await this.saveSubNote(content);
				} else {
					await this.saveNote(content);
				}
			} catch (error) {
				console.error("Error saving note:", error);
				new Notice("Failed to save note. Please try again.");
			}
		}, this.DEBOUNCE_DELAY);
	}

	async forceSave(value: string): Promise<void> {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
			this.saveTimeout = null;
		}

		try {
			if (this.stateManager.getState().isInSubNote) {
				await this.saveSubNote(value);
			} else {
				await this.saveNote(value);
			}
		} catch (error) {
			console.error("Error force saving note:", error);
		}
	}

	createLockButton(container: HTMLElement): HTMLButtonElement {
		const lockBtn = container.createEl("button", {
			text: "Page Mode",
			cls: "page-lock-button",
		});

		lockBtn.style.color = "var(--green)";
		setIcon(lockBtn, "lock-open");

		return lockBtn;
	}

	togglePageMode(btnState: boolean, lockBtn: HTMLElement): void {
		if (!btnState) {
			setIcon(lockBtn, "lock-open");
			lockBtn.style.color = "var(--green)";
			const file = this.stateManager.getCurrentPdf();

			if (file) {
				this.startListeningToPageChange(file);
			}
		} else {
			setIcon(lockBtn, "lock");
			lockBtn.style.color = "var(--red)";
			this.cleanupPageChangeListener();
		}
		btnState = !btnState;
	}

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
			const modal = container.get<NoLinkedFileModalFactory>(
				TYPES.NoLinkedFileModalFactory
			)(file.path);
			modal.open();
			this.stateManager.setCurrentPdf(null);
			await this.pdfNotesService.onPdfChanged();
			return;
		}
		this.stateManager.setCurrentPdf(file);
		this.stateManager.setIsPageMode(existingLink?.isPageMode || null);
		await this.pdfNotesService.onPdfChanged();
	}

	async getLinkedNotePath(pdfPath: string): Promise<string | null> {
		const linkedNote = await this.fileLinkService.getLinkedNotePath(
			pdfPath
		);
		return linkedNote?.notePath || null;
	}

	async getLinkedPdfPath(notePath: string): Promise<string | null> {
		const linkedNote = await this.fileLinkService.getLinkedPdfPath(
			notePath
		);
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

			if (pdfPath) {
				await this.fileLinkService.deleteNoteLink(file.path);
				new Notice(`Link to note deleted: ${file.path}`);
			} else {
				new Notice(`No linked PDF found for note: ${file.path}`);
			}
		}
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

			this.pdfNotesService.saveNoteByFilePath(
				linkedNote?.notePath || "",
				content
			);
		} else {
			await this.pdfNotesService.saveNoteByPage(content);
		}
	}

	async getNoteContent(): Promise<string> {
		const state = this.stateManager.getState();
		if (!state.currentPdf) return "";

		const pdf = this.stateManager.getCurrentPdf();

		if (!pdf) {
			return "";
		}

		const linkedNote = await this.fileLinkService.getLinkedNotePath(
			pdf.path
		);

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
				this.stateManager.setCurrentPdf(null);
			}
		} else if (pdf && !this.stateManager.getIsPageMode()) {
			return await this.pdfNotesService.getNotesContent(
				linkedNote?.notePath || ""
			);
		}
		return "";
	}

	mainNote(): void {
		this.pdfNotesService.mainNote();
	}

	previousSubNote(): void {
		this.pdfNotesService.previousSubNote();
	}

	getSubNoteFileName(): string | null {
		const subNotePath = this.stateManager.peekNavigationStack();
		if (!subNotePath) {
			return null;
		}
		return subNotePath.split("/").pop()?.split(".")[0] || null;
	}

	async getSubNoteContent(): Promise<string> {
		return await this.pdfNotesService.getSubNoteContent();
	}

	async openSubNote(fileName: string): Promise<void> {
		let subNotePath = await this.app.metadataCache.getFirstLinkpathDest(
			fileName,
			""
		)?.path;

		if (!subNotePath) {
			const linkedNote = await this.fileLinkService.getLinkedNoteFile();

			const folderPath = linkedNote?.path.substring(
				0,
				linkedNote.path.lastIndexOf("/")
			);

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
}
