import { inject, injectable } from "inversify";
import { App, TFile } from "obsidian";
import { container, TYPES } from "src/container";
import { PdfNotesService } from "src/Service/PdfNotesService";
import { INoteRepository } from "src/type/INoteRepository";

@injectable()
export class NoteRepository implements INoteRepository {
	private notes: string[] = [];

	constructor(@inject(TYPES.App) private app: App) {}

	async initialize() {
		const pdfNoteService = container.get<PdfNotesService>(
			TYPES.PdfNotesService
		);
		const noteFile = await pdfNoteService.getLinkedNoteFile();

		if (noteFile == null) {
			throw new Error("No linked note file found.");
		}

		const content = await this.app.vault.read(noteFile);

		if (!content) {
			this.notes = [];
			return;
		}

		const loadedNotes = this.parseMarkdownNotes(content);

		// Fusionner les nouvelles notes avec celles déjà en mémoire
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

	async save(): Promise<void> {
		const pdfNoteService = container.get<PdfNotesService>(
			TYPES.PdfNotesService
		);
		const note = await pdfNoteService.getLinkedNoteFile();

		if (!note) {
			throw new Error(`No linked note found for PDF: ${pdf.path}`);
		}

		const content = this.generateMarkdownContent(this.notes);
		const file = (await this.app.vault.getAbstractFileByPath(
			note.path
		)) as TFile;

		if (file) {
			await this.app.vault.modify(file, content);
		}
	}

	async findByPage(page: number): Promise<string | null> {
		return this.notes[page] || null;
	}

	async delete(noteId: string): Promise<void> {
		// Implémentation de suppression si nécessaire
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
			.map((content, pageNumber) => `## Page ${pageNumber}\n${content}\n`)
			.join("\n");
	}
}
