import { ItemView, setIcon, WorkspaceLeaf } from "obsidian";
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
	titleSubFileElement: HTMLElement | null = null;
	historyElement: HTMLElement | null = null;
	editor: EmbeddableMarkdownEditor;
	sidebarLeaf: WorkspaceLeaf | null = null;
	container: HTMLElement;
	private subNoteStack: string[] = [];
	testElement: HTMLElement | null = null;

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
		return "wand-sparkles";
	}

	canNavigate(): boolean {
		return false;
	}

	async onOpen() {
		this.container = this.containerEl.children[1] as HTMLElement;
		this.container.classList.add("pdf-notes-sidebar");
		if (!container) return;
		this.container.empty();

		this.container.createEl("h3", {
			text: `📝 Notes: ${this.noteService.getFileName()}`,
			cls: "pdf-title",
		});

		this.titleSubFileElement = this.container.createEl("h5", {
			cls: "pdf-subtitle",
		});

		this.titleSubFileElement.style.display = "none";

		const div = this.container.createDiv({ cls: "pdf-div" });

		const prevButton = div.createEl("button", {
			cls: "nav-button",
			attr: {
				"aria-label": "Previous Page",
			},
		});

		setIcon(prevButton, "chevron-left");

		this.titlePageElement = div.createEl("h3", {
			text: `Page ${this.noteService.getCurrentPage()}`,
			cls: "pdf-page-note",
		});

		this.container.createEl("hr", { cls: "pdf-notes" });

		prevButton.addEventListener("click", async () => {
			const filename = this.subNoteStack.pop();

			this.removeLastHistory();

			if (!filename) return;

			if (filename == this.fileService.getPdfFile()?.basename) {
				const notes = await this.noteService.getSavedNotes(
					this.noteService.getCurrentPage()
				);

				prevButton.style.display = "none";
				if (this.titleSubFileElement) {
					this.titleSubFileElement.style.display = "none";
				}

				this.noteService.setInSubNote(false);
				await this.fileService.initialiseMdFile(filename);
				this.editor.set(notes ?? "");
			} else {
				this.noteService.setInSubNote(true);
				await this.openSubNote(filename);
				if (this.titleSubFileElement) {
					this.titleSubFileElement.style.display = "block";
					this.titleSubFileElement.setText(`Subfile: ${filename}`);
				}
			}
		});

		prevButton.style.display = "none";

		const hierarchyHoverButton = div.createDiv({
			text: "test",
			cls: "pdf-test-parent",
		});

		this.historyElement = this.container.createDiv({
			cls: "pdf-test-element",
		});
		hierarchyHoverButton.appendChild(this.historyElement);

		setIcon(hierarchyHoverButton, "history");

		const savedNotes = await this.noteService.getSavedNotes(
			this.noteService.getCurrentPage()
		);

		const onClickLink = async (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			prevButton.style.display = "inline-block";
			this.noteService.setInSubNote(true);

			const filename = target.textContent;

			if (!filename) return;

			const mdFile = this.fileService.getMdFile();

			if (mdFile) {
				console.log("mdfile", mdFile.basename);
				this.subNoteStack.push(mdFile.basename);
			}

			this.openSubNote(filename);

			this.addHistory(filename);
		};

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
			onClickLink: onClickLink,
			cls: "pdf-editor",
		});

		this.updateNotesSidebar();
	}

	async addHistory(fileName: string) {
		if (this.historyElement) {
			this.historyElement
				.createDiv({
					text: fileName,
				})
				.createSpan({
					text: " >",
					cls: "pdf-history-separator",
				});
		}
		if (this.titleSubFileElement) {
			this.titleSubFileElement.style.display = "block";
			this.titleSubFileElement.setText(`Subfile: ${fileName}`);
		}
	}

	async removeLastHistory() {
		if (this.historyElement && this.historyElement.lastChild) {
			this.historyElement.lastChild.remove();
		}
	}

	async openSubNote(filename: string) {
		await this.fileService.initialiseMdFile(filename);

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

			if (this.historyElement) {
				this.historyElement.empty();
			}

			if (this.noteService.getFileName()) {
				await this.addHistory(this.noteService.getFileName() as string);

				if (this.titleSubFileElement) {
					this.titleSubFileElement.style.display = "none";
				}
			}

			const elem = this.container.find(".nav-button");

			if (elem) {
				elem.style.display = "None";
			}
		}
		this.titlePageElement?.setText(
			`Page ${this.noteService.getCurrentPage()}`
		);
		console.log("pdfFile", this.fileService.getPdfFile());
		console.log("mdFile", this.fileService.getMdFile());
		console.log(
			"content",
			this.noteService.getSavedNotes(this.noteService.getCurrentPage())
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
