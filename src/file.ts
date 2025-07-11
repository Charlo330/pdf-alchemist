import { inject, injectable } from "inversify";
import { App, Notice, TFile } from "obsidian";
import { PdfNoteLinker } from "./PdfNoteLinker";

const TYPES = {
	App: Symbol.for("App"),
	FileService: Symbol.for("FileService"),
	NoteService: Symbol.for("NoteService"),
	SidebarService: Symbol.for("SidebarService"),
};

@injectable()
export class FileService {
	pdfFile: TFile | null = null;
	mdFile: TFile | null = null;
	pdfNoteLinker: PdfNoteLinker | null = null;

	constructor(
		@inject(TYPES.App)
		public app: App
	) {
		this.pdfNoteLinker = new PdfNoteLinker(app);
	}

	async changePdfFile(file: TFile | null) {
		if (!file || file.extension !== "pdf") {
			return;
		}
		this.pdfFile = file;
		await this.initialiseMdFile();
	}

	async initialiseMdFile(filename = "") {
		if (filename) {
			this.mdFile = this.app.metadataCache.getFirstLinkpathDest(
				filename,
				""
			);
			return;
		}
		if (!this.pdfFile) return;

		console.log("Loading notes from PDF file:", this.pdfFile.path);

		const noteFilepath = this.getNoteLinkFromPdf(
			this.getPdfFile().path
		);

		console.log("Note file path:", noteFilepath);

		if (!noteFilepath) {
			new Notice(
				"No note linked to this PDF file. Please create a note first."
			);
			return;
		}

		this.mdFile = (await this.app.vault.getAbstractFileByPath(
			noteFilepath
		)) as TFile;

		console.log(this.mdFile)

		if (!this.mdFile) {
			// TODO setting
			this.mdFile = await this.app.vault.create(
				`${this.pdfFile?.basename}.md`,
				""
			);
			this.pdfNoteLinker?.linkPdfToNote(
				this.pdfFile.path,
				this.mdFile.path
			);
		}
	}

	async readMdFile(): Promise<string> {
		if (!this.mdFile) {
			new Notice("No markdown file to read.");
			return "";
		}
		const content = await this.app.vault.read(this.mdFile);
		return content;
	}
	getMdFile() {
		return this.mdFile;
	}
	getMdFilePath() {
		return this.mdFile ? this.mdFile.path : "";
	}
	getPdfFile() {
		for (const leaf of this.app.workspace.getLeavesOfType("pdf")) {
			const view = leaf.view;
			// Selon comment le PDF est géré, parfois tu peux faire :
			if (view && view.file?.extension === "pdf") {
				return view.file;
			}
		}
	}

	getPdfLinkFromNote(notePath: string): string | null {
		if (!this.pdfNoteLinker) {
			new Notice("PdfNoteLinker is not initialized.");
			return null;
		}
		return this.pdfNoteLinker.getPdfForNote(notePath);
	}

	getNoteLinkFromPdf(pdfPath: string): string | null {
		if (!this.pdfNoteLinker) {
			new Notice("PdfNoteLinker is not initialized.");
			return null;
		}
		console.log("getNoteLinkFromPdf", pdfPath);
		return this.pdfNoteLinker.getNoteForPdf(pdfPath);
	}

	async isNotePdfLinked(filePath: string): Promise<boolean> {
		if (!filePath) return false;

		const noteFilepath = await this.getPdfLinkFromNote(filePath);
		console.log("isNotePdfLinked", noteFilepath);

		if (!noteFilepath) return false;

		return true;
	}
}
