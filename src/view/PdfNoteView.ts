import { ItemView, WorkspaceLeaf } from "obsidian";
import {
	createEmbeddableMarkdownEditor,
	EmbeddableMarkdownEditor,
} from "embeddable-editor";
import { AppState } from "src/type/AppState";
import { StateManager } from "src/StateManager";
import { PdfNotesController } from "src/controller/PdfNotesController";

export const PDF_NOTE_VIEW = "pdf-note-view";

export class PdfNoteView extends ItemView {
	private editor: EmbeddableMarkdownEditor;
	private titleElement: HTMLElement;
	private pageElement: HTMLElement;
	private unsubscribe: (() => void) | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private controller: PdfNotesController,
		private stateManager: StateManager
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
		return "file-text";
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.classList.add("pdf-notes-sidebar");

		this.titleElement = container.createEl("h3", {
			text: "📝 PDF Notes",
			cls: "pdf-title",
		});

		this.pageElement = container.createEl("h4", {
			text: "Page 1",
			cls: "pdf-page-title",
		});

		container.createEl("hr");

		const initialContent = await this.controller.getNoteForCurrentPage();

		this.editor = createEmbeddableMarkdownEditor(this.app, container, {
			value: initialContent,
			placeholder: "Type your notes here...",
			onChange: () => {
				this.controller.saveNote(this.editor.value);
			},
			cls: "pdf-editor",
		});

		// S'abonner aux changements d'état
		this.unsubscribe = this.stateManager.subscribe(
			this.onStateChange.bind(this)
		);
	}

	async onStateChange(state: AppState): Promise<void> {
		if (state.currentPdf) {
			this.titleElement.setText(`📝 Notes: ${state.currentPdf.basename}`);
			this.pageElement.setText(`Page ${state.currentPage}`);

			const content = await this.controller.getNoteForCurrentPage();
			console.log("Current page content:", content);
			this.editor.set(content);
		} else {
			this.titleElement.setText("📝 No PDF opened");
			this.pageElement.setText("");
			this.editor.set("");
		}
	}

	async onClose() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}
}
