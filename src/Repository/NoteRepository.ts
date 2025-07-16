import { inject, injectable } from "inversify";
import { App, TFile } from "obsidian";
import { TYPES } from "src/container";
import { INoteRepository } from "src/type/INoteRepository";
import type { ILinkRepository } from "src/type/ILinkRepository";

@injectable()
export class NoteRepository implements INoteRepository {
	private notes: string[] = [];

	constructor(
		@inject(TYPES.App) private app: App,
		@inject(TYPES.LinkRepository) private linkRepo: ILinkRepository
	) {}

	async initialize(pdfPath: string) {
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

		// Merge new notes with existing ones in memory
		if (!this.notes) {
			this.notes = [];
		}
		this.notes = Object.assign(this.notes, loadedNotes);
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

	async save(pdfPath: TFile): Promise<void> {
		const link = await this.linkRepo.findByPdf(pdfPath.path);

		if (!link) {
			throw new Error(`No linked note found for PDF: ${pdfPath}`);
		}

		const content = this.generateMarkdownContent(this.notes);
		const file = this.app.vault.getFileByPath(link.notePath) as TFile;

		if (file) {
			await this.app.vault.modify(file, content);
		} else {
			throw new Error(`Note file not found: ${link.notePath}`);
		}
	}

	async findByPage(page: number): Promise<string | null> {
		return this.notes[page] || null;
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
				return '';
			})
			.filter(content => content !== '')
			.join("\n");
	}
}
