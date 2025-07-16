import { App } from "obsidian";

export class PdfNoteLinker {
	private app: App;
	private index: Record<string, string> = {};
	private readonly indexPath = "pdf-note-index.json";

	constructor(app: App) {
		this.app = app;
		this.initialize();
	}

	private async initialize() {
		await this.createFileIfNotExists(this.indexPath);
		await this.loadIndex();
	}

	private async createFileIfNotExists(filePath: string): Promise<void> {
		try {
			if (!(await this.app.vault.adapter.exists(filePath))) {
				await this.app.vault.adapter.write(filePath, "{}");
			}
		} catch (error) {
			console.error(`Error creating file ${filePath}:`, error);
			throw error;
		}
	}

	private async loadIndex() {
		try {
			const data = await this.app.vault.adapter.read(this.indexPath);
			this.index = JSON.parse(data);
		} catch (e) {
			console.warn("Failed to load index, initializing empty.");
			this.index = {};
		}
	}

	private async saveIndex() {
		const jsonString = JSON.stringify(this.index, null, 2);
		await this.app.vault.adapter.write(this.indexPath, jsonString);
	}

	public getNoteForPdf(pdfPath: string): string | null {
		return this.index[pdfPath] || null;
	}

	public getPdfForNote(notePath: string): string | null {
		const pdfPath = Object.keys(this.index).find(
			(key) => this.index[key] === notePath
		);
		console.log("getPdfForNote", pdfPath);
		return pdfPath || null;
	}

	public async linkPdfToNote(pdfPath: string, notePath: string) {
		this.index[pdfPath] = notePath;
		await this.saveIndex();
	}

	updateNotePathInIndex(oldPath: string, newPath: string) {
		for (const pdfPath in this.index) {
			if (this.index[pdfPath] === oldPath) {
				this.index[pdfPath] = newPath;
			}
		}
		this.saveIndex();
	}

	updatePdfPathInIndex(oldPath: string, newPath: string) {
		if (this.index[oldPath]) {
			this.index[newPath] = this.index[oldPath];
			delete this.index[oldPath];
			this.saveIndex();
		}
	}
}
