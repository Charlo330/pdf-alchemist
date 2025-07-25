import { ItemView, setIcon, WorkspaceLeaf } from "obsidian";
import {
	createEmbeddableMarkdownEditor,
	EmbeddableMarkdownEditor,
} from "embeddable-editor";
import { AppState } from "src/type/AppState";
import { StateManager } from "src/StateManager";
import { PdfNotesController } from "src/controller/PdfNotesController";
import { SubNotesController } from "src/controller/SubNotesController";
import { injectable } from "inversify";

export const PDF_NOTE_VIEW = "pdf-note-view";

@injectable()
export class PdfNoteView extends ItemView {
	private editor: EmbeddableMarkdownEditor;
	private titleElement: HTMLElement;
	private subTitleElement: HTMLElement;
	private pageElement: HTMLElement;
	private emptyElement: HTMLElement;
	private buttonDiv: HTMLElement;
	private unsubscribe: (() => void) | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private pdfNoteController: PdfNotesController,
		private subNoteController: SubNotesController,
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
			text: "",
			cls: "pdf-title",
		});

		const divSubtitle = container.createDiv({
			cls: "pdf-subtitle",
		});

		const icon = divSubtitle.createEl("h2", {
			text: "PDF Notes",
			cls: "pdf-subtitle-text",
		});

		setIcon(icon, "corner-down-right");

		this.subTitleElement = divSubtitle.createEl("p", {
			text: "Notes for the current PDF",
			cls: "pdf-subtitle-text",
		});

		const navDiv = container.createDiv("pdf-nav");

		this.buttonDiv = navDiv.createDiv("pdf-button-container");

		const backButton = this.buttonDiv.createEl("button", {
			text: "Back",
			cls: "navigation-button",
		});

		backButton.onclick = () => {
			this.subNoteController.previousSubNote();
		};

		const homeButton = this.buttonDiv.createEl("button", {
			text: "Home",
			cls: "navigation-button",
		});

		homeButton.onclick = () => {
			this.subNoteController.mainNote();
		};

		setIcon(backButton, "chevron-left");

		setIcon(homeButton, "home");

		this.pageElement = navDiv.createEl("h5", {
			text: "Page 1",
			cls: "pdf-page-title",
		});

		this.emptyElement = container.createEl("p", {
			text: "No PDF opened or no notes available.",
			cls: "pdf-note-instructions",
		});

		this.editor = createEmbeddableMarkdownEditor(this.app, container, {
			value: "",
			placeholder: "Type your notes here...",
			onChange: () => {
				if (this.stateManager.getState().isInSubNote) {
					this.subNoteController.saveSubNote(this.editor.value);
				} else {
					this.pdfNoteController.saveNote(this.editor.value);
				}
			},
			onClickLink: async (event) => {
				const target = event.target as HTMLAnchorElement;

				if (target.textContent) {
					await this.subNoteController.openSubNote(target.textContent);
				}
			},
			cls: "pdf-editor",
		});

		// S'abonner aux changements d'état
		this.unsubscribe = this.stateManager.subscribe(
			this.onStateChange.bind(this)
		);

		this.onStateChange(this.stateManager.getState());
	}

	async onStateChange(state: AppState): Promise<void> {
		if (state.isInSubNote) {
			this.subTitleElement.setText(`${this.subNoteController.getSubNoteFileName()}`);
			this.pageElement.setText(`Page ${state.currentPage}`);
			this.emptyElement.style.display = "none";

			const subNoteContent = await this.subNoteController.getSubNoteContent();
			this.editor.show();
			this.editor.set(subNoteContent);
			this.subTitleElement.parentElement?.toggleVisibility(true);
			return;
		}

		if (state.currentPdf !== null && state.currentPdf !== undefined) {
			this.titleElement.setText(`${state.currentPdf.basename}`);
			this.pageElement.setText(`Page ${state.currentPage}`);

			const content = await this.pdfNoteController.getNoteForCurrentPage();
			this.editor.show();
			this.editor.set(content);
			this.emptyElement.style.display = "none";
			this.buttonDiv.style.display = "block";
			this.subTitleElement.parentElement?.toggleVisibility(false);
		} else {
			this.titleElement.setText("No PDF opened");
			this.pageElement.setText("");
			this.buttonDiv.style.display = "none";
			this.editor.hide();
			this.editor.set("");
			this.emptyElement.style.display = "block";
			this.subTitleElement.parentElement?.toggleVisibility(false);
		}
	}

	async onClose() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}
}
