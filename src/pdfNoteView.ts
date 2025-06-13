import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import {
	createEmbeddableMarkdownEditor,
	EmbeddableMarkdownEditor,
} from "embeddable-editor";
import { NoteService } from "./notes";
import { container } from "./container";
import { FileService } from "./file";

export const PDF_NOTE_VIEW = "pdf-note-view";

export class PdfNoteView extends ItemView {
	titlePageElement: HTMLElement;
	editor: EmbeddableMarkdownEditor;
	sidebarLeaf: WorkspaceLeaf | null = null;
	container: HTMLElement;
	private subNoteStack: string[] = [];

	constructor(
		leaf: WorkspaceLeaf,
		private noteService: NoteService,
		private fileService: FileService
	) {
		super(leaf);
	}

	getViewType(): string {
		return PDF_NOTE_VIEW;
	}

	getDisplayText(): string {
		return "📝 PDF Notes";
	}

	getIcon(): string {
		return "music";
	}

	async onOpen() {
		this.container = this.containerEl.children[1] as HTMLElement;
		if (!container) return;
		this.container.empty();
		this.container.addClass("pdf-notes-sidebar");

		this.container.createEl("h3", {
			text: `📝 Notes: ${this.noteService.getFileName()}`,
			cls: "pdf-title",
		});

		let div = this.container.createDiv({ cls: "pdf-div" });

		this.titlePageElement = div.createEl("h3", {
			text: `Page ${this.noteService.getCurrentPage()}`,
			cls: "pdf-page-note",
		});

		this.container.createEl("hr", { cls: "pdf-notes" });

		div = this.container.createDiv({
			cls: "nav-buttons-div"
		})

		const prevButton = div.createEl("button", {
			text: "Previous Page",
			cls: "nav-button",
			attr: {
				"aria-label": "Previous Page",
			},
		});

		const savedNotes = await this.noteService.getSavedNotes(
			this.noteService.getCurrentPage()
		);

		prevButton.addEventListener("click", async () => {
			const filename = this.subNoteStack.pop();
			console.log("mdfile pop", filename)
			console.log("pdf", this.fileService.getPdfFile()?.basename)

			if (!filename) return;

			if (filename == this.fileService.getPdfFile()?.basename) {
				if (savedNotes) {
					await this.fileService.initialiseMdFile(filename);
					this.noteService.setCurrentPage(1);
					this.editor.set(savedNotes);
				}
			}
			else {
				console.log("entrer2")
				await this.openSubNote(filename);
			}
		});

		this.editor = createEmbeddableMarkdownEditor(this.app, this.container, {
			value: savedNotes,
			placeholder: "Type here...",
			onChange: () => {
				console.log(this.editor.value);
				console.log(this.noteService.getCurrentPage());
				this.noteService.saveNotes(
					this.noteService.getCurrentPage(),
					this.editor.value
				);
			},
			onBlur: async (editor) => {
				console.log("Éditeur perdu le focus", editor.value);
			},
			onSubmit: () => {},
		});

		this.editor.editor.cm.contentDOM.addEventListener(
			"click",
			(event: MouseEvent) => this.onClickLink(event),
			true
		);
	}

	async onClickLink(event: MouseEvent) {
		const target = event.target as HTMLElement;

		if (
			target.tagName === "A" &&
			target.hasAttribute("href") &&
			target.parentElement?.className.contains("cm-hmd-internal")
		) {
			event.stopImmediatePropagation(); // Empêche le comportement par défaut du clic

			const filename = target.textContent;

			if (!filename) return;

			const mdFile = this.fileService.getMdFile();

			if (mdFile) {
				console.log("mdfile", mdFile.basename)
				this.subNoteStack.push(mdFile.basename);
			}

			this.openSubNote(filename);

			//const filepath = this.fileService.getMdFilePath();
		}
	}

	async openSubNote(filename: string) {
		await this.fileService.initialiseMdFile(filename);
		this.noteService.setCurrentPage(-1);

		await this.fileService.readMdFile().then((content) => {
			this.editor.set(content);
		});
	}

	async updateNotesSidebar() {
		if (this.editor) {
			const content = await this.noteService.getSavedNotes(
				this.noteService.getCurrentPage()
			);
			this.editor.set(content ?? "");
		}
		this.titlePageElement?.setText(
			`Page ${this.noteService.getCurrentPage()}`
		);
	}

	emptySidebar() {
		this.container.empty();
		this.container.createDiv({
			text: "📝 No pdf opened",
			cls: "pdf-empty",
		});
		this.container.innerHTML = "📝 No pdf opened";
	}
}
