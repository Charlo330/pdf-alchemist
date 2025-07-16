import { inject, injectable } from "inversify";
import { App } from "obsidian";
import { TYPES } from "src/type/types";
import { ILinkRepository } from "src/type/ILinkRepository";
import { PdfNoteLink } from "src/type/PdfNoteLink";

@injectable()
export class JsonLinkRepository implements ILinkRepository {
	private readonly indexPath = "pdf-note-index.json";
	private index: Record<string, string> = {};

	constructor(@inject(TYPES.App) private app: App) {
		this.initialize();
	}

	private async initialize(): Promise<void> {
		if (!(await this.app.vault.adapter.exists(this.indexPath))) {
			await this.app.vault.create(this.indexPath, "{}");
		}
		await this.loadIndex();
	}

	private async loadIndex(): Promise<void> {
		try {

			const content = await this.app.vault.adapter.read(this.indexPath);
			console.log("Loaded index content:", content);
			this.index = JSON.parse(content);
		} catch (error) {
			console.warn("Failed to load index, initializing empty.");
			this.index = {};
		}
	}

	private async saveIndex(): Promise<void> {
		const content = JSON.stringify(this.index, null, 2);
		await this.app.vault.adapter.write(this.indexPath, content);
	}

	async save(link: PdfNoteLink): Promise<void> {
		this.index[link.pdfPath] = link.notePath;
		await this.saveIndex();
	}

	async findByPdf(pdfPath: string): Promise<PdfNoteLink | null> {
		const notePath = this.index[pdfPath];
		return notePath ? { pdfPath, notePath } : null;
	}

	async findByNote(notePath: string): Promise<PdfNoteLink | null> {
		const pdfPath = Object.keys(this.index).find(
			(key) => this.index[key] === notePath
		);
		return pdfPath ? { pdfPath, notePath } : null;
	}

	async delete(pdfPath: string): Promise<void> {
		delete this.index[pdfPath];
		await this.saveIndex();
	}

	async updatePdfPath(oldPath: string, newPath: string): Promise<void> {
		if (this.index[oldPath]) {
			this.index[newPath] = this.index[oldPath];
			delete this.index[oldPath];
			await this.saveIndex();
		}
	}

	async updateNotePath(oldPath: string, newPath: string): Promise<void> {
		for (const pdfPath in this.index) {
			if (this.index[pdfPath] === oldPath) {
				this.index[pdfPath] = newPath;
			}
		}
		await this.saveIndex();
	}
}
