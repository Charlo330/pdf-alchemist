import { inject, injectable } from "inversify";
import { App, TFile } from "obsidian";
import { TYPES } from "src/type/types";
import { INoteRepository } from "src/type/INoteRepository";
import type { ILinkRepository } from "src/type/ILinkRepository";
import { StateManager } from "src/StateManager";

@injectable()
export class NoteRepository implements INoteRepository {
	private notes: string[] = [];
	private unsubscribe: (() => void) | null = null;

	constructor(
		@inject(TYPES.App) private app: App,
		@inject(TYPES.LinkRepository) private linkRepo: ILinkRepository,
		@inject(TYPES.StateManager) private stateManager: StateManager
	) {}

	async initialize() {
		const pdfPath = this.stateManager.getCurrentPdf()?.path;

		if (!pdfPath) {
			throw new Error("No PDF path found.");
		}
		const link = await this.linkRepo.findByPdf(pdfPath);

		if (!link) {
			throw new Error("No linked note file found.");
		}

		const noteFile = this.app.vault.getFileByPath(link.notePath);
		if (!noteFile) {
			throw new Error(`Note file not found: ${link.notePath}`);
		}

		const content = await this.app.vault.read(noteFile);

		if (!content) {
			this.notes = [];
			return;
		}

		const loadedNotes = this.parseMarkdownNotes(content);

		// Initialize notes array properly
		this.notes = [];
		// Copy loaded notes to the array
		for (let i = 0; i < loadedNotes.length; i++) {
			if (loadedNotes[i]) {
				this.notes[i] = loadedNotes[i];
			}
		}
	}

	parseMarkdownNotes(content: string): string[] {
		const notes: string[] = [];
		const matches = content.matchAll(
			/## Page (\d+)\n([\s\S]*?)(?=\n## Page \d+|\n?$)/g
		);

		for (const match of matches) {
			const pageNum = parseInt(match[1], 10);
			notes[pageNum] = match[2].trim();
		}

		return notes;
	}

	async save(pdfPath: string, page: number, content: string): Promise<void> {
		const link = await this.linkRepo.findByPdf(pdfPath);

		this.notes[page] = content;

		if (!link) {
			throw new Error(`No linked note found for PDF: ${pdfPath}`);
		}

		const markdownContent = this.generateMarkdownContent(this.notes);

		const file = this.app.vault.getFileByPath(link.notePath) as TFile;

		console.log("file", file);

		if (file) {
			await this.app.vault.modify(file, markdownContent);
		} else {
			throw new Error(`Note file not found: ${link.notePath}`);
		}
	}

	async findByPage(page: number): Promise<string | null> {
		return this.notes[page] || null;
	}

	async findSubNoteContent(subNotePath: string): Promise<string | Promise<string>> {
		const content = await this.app.vault.getAbstractFileByPath(subNotePath);

		if (!content || !(content instanceof TFile)) {
			throw new Error(`Sub-note file not found: ${subNotePath}`);
		}

		return content.path;
	}

	async delete(noteId: string): Promise<void> {
		// Implementation for deletion if needed
	}

	parseMarkdownContent(content: string): Map<number, string> {
		const notes = new Map<number, string>();
		const matches = content.matchAll(
			/## Page (\d+)\n([\s\S]*?)(?=\n## Page \d+|\n?$)/g
		);

		for (const match of matches) {
			const pageNum = parseInt(match[1], 10);
			notes.set(pageNum, match[2].trim());
		}

		return notes;
	}

	generateMarkdownContent(notes: string[]): string {
		return notes
			.map((content, pageNumber) => {
				if (content) {
					return `## Page ${pageNumber}\n${content}\n`;
				}
				return "";
			})
			.filter((content) => content !== "")
			.join("\n");
	}

	onClose() {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
	}
}
