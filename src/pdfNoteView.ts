import { ItemView, WorkspaceLeaf, Notice, setIcon } from "obsidian";
import { EmbeddableMarkdownEditor } from "embeddable-editor";
import { NoteService } from "./notes";
import { container } from "./container";

export const PDF_NOTE_VIEW = "pdf-note-view";

export class PdfNoteView extends ItemView {
	titlePageElement: HTMLElement;
	editor: EmbeddableMarkdownEditor;
	sidebarLeaf: WorkspaceLeaf | null = null;
	container: HTMLElement;

	constructor(
		leaf: WorkspaceLeaf,
		private noteService: NoteService
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

		const div = this.container.createDiv({ cls: "pdf-div" });

		this.titlePageElement = div.createEl("h3", {
			text: `Page ${this.noteService.getCurrentPage()}`,
			cls: "pdf-page-note",
		});

		const refreshButton = div.createEl("button", { cls: "pdf-button-refresh" });
		refreshButton.addEventListener("click", async () => {
			await this.noteService.refresh();
			await this.updateNotesSidebar();
			new Notice("🔄 Notes refreshed");
		});
		setIcon(refreshButton, "refresh-ccw");

		this.container.createEl("hr", { cls: "pdf-notes" });

		const savedNotes = await this.noteService.getSavedNotes(this.noteService.getCurrentPage());

		this.editor = new EmbeddableMarkdownEditor(this.app, this.container, {
			value: savedNotes,
			placeholder: "Type here...",
			onChange: () => {
				this.noteService.saveNotes(this.noteService.getCurrentPage(), this.editor.value);
			},
			onBlur: (editor) => {
				console.log("Éditeur perdu le focus", editor.value);
			},
			onSubmit: () => {},
		});
	}

	async updateNotesSidebar() {
		if (this.editor) {
			const content = await this.noteService.getSavedNotes(this.noteService.getCurrentPage());
			this.editor.value = content ?? "";
		}
		this.titlePageElement?.setText(`Page ${this.noteService.getCurrentPage()}`);
	}

	emptySidebar() {
		this.container.empty();
		this.container.createDiv({ text: '📝 No pdf opened', cls: 'pdf-empty' });
		this.container.innerHTML = '📝 No pdf opened';
	}
}
