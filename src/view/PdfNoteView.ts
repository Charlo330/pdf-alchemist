import { ItemView, setIcon, TFile, WorkspaceLeaf } from "obsidian";
import {
	createEmbeddableMarkdownEditor,
	EmbeddableMarkdownEditor,
} from "embeddable-editor";
import { AppState } from "src/type/AppState";
import { StateManager } from "src/StateManager";
import { PdfNotesController } from "src/controller/PdfNotesController";
import { SubNotesController } from "src/controller/SubNotesController";
import { injectable } from "inversify";
import { FileLinkedModal } from "./FileLinkedModal";
import { PdfViewer } from "src/type/PdfViewer";

export const PDF_NOTE_VIEW = "pdf-note-view";

@injectable()
export class PdfNoteView extends ItemView {
	private editor: EmbeddableMarkdownEditor;
	private titleElement: HTMLElement;
	private titleIcon: HTMLElement;
	private subTitleElement: HTMLElement;
	private pageElement: HTMLElement;
	private emptyElement: HTMLElement;
	private buttonDiv: HTMLElement;
	private unsubscribe: (() => void) | null = null;
	private currentPdfEventListeners: Array<{
		viewer: PdfViewer;
		callback: (event: { pageNumber: number }) => void;
	}> = [];

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
		return "wand-sparkles";
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.classList.add("pdf-notes-sidebar");

		await this.createEventListeners();

		const divTitle = container.createDiv({
			cls: "pdf-title-container",
		});

		this.titleIcon = divTitle.createDiv({
			cls: "pdf-title-icon",
		});

		if (this.stateManager.getIsPageMode()) {
			setIcon(this.titleIcon, "file-stack");
		} else {
			setIcon(this.titleIcon, "file");
		}

		this.titleElement = divTitle.createEl("h3", {
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
					await this.subNoteController.openSubNote(
						target.textContent
					);
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

	async createEventListeners() {
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFile) {
					menu.addItem((item) => {
						item.setTitle("Show linked file")
							.setIcon("link")
							.onClick(async () => {
								let linkedPath = null;
								if (file.extension === "pdf") {
									linkedPath =
										await this.pdfNoteController.getLinkedNotePath(
											file.path
										);
								} else if (file.extension === "md") {
									linkedPath =
										await this.pdfNoteController.getLinkedPdfPath(
											file.path
										);
								}
								new FileLinkedModal(
									this.app,
									linkedPath
								).open();
							});
					});
				}
			})
		);

		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				console.log("File renamed:", file, "Old path:", oldPath);
				this.pdfNoteController.updateFilesPath(file, oldPath);
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", async (file) => {
				if (file instanceof TFile) {
					console.log("File deleted:", file);
					await this.pdfNoteController.deleteLink(file);
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("file-open", async (file) => {
				console.log("File opened:", file);
				await this.pdfNoteController.onPdfFileChanged(file);
				this.setupChangePageEventListeners();
			})
		);

		this.app.workspace.onLayoutReady(() => {
			this.setupChangePageEventListeners();
		});
	}

	private setupChangePageEventListeners() {
		this.cleanupPdfEventListeners();

		const pdfViewers = this.findPdfViewer();

		if (!pdfViewers || pdfViewers.length === 0) {
			console.warn("Aucun viewer PDF trouvé");
			return;
		}

		for (const viewer of pdfViewers) {
			if (viewer?.eventBus) {
				const callback = async (event: { pageNumber: number }) => {
					this.pdfNoteController.onPageChanged(event.pageNumber);
					console.log("Page changed to:", event.pageNumber);
				};

				viewer.eventBus.on("pagechanging", callback);

				this.currentPdfEventListeners.push({
					viewer: viewer,
					callback: callback,
				});
			}
		}
	}

	private cleanupPdfEventListeners() {
		for (const { viewer, callback } of this.currentPdfEventListeners) {
			if (viewer?.eventBus && callback) {
				try {
					viewer.eventBus.off("pagechanging", callback);
				} catch (error) {
					console.warn(
						"Error during page changing event cleanup",
						error
					);
				}
			}
		}

		this.currentPdfEventListeners = [];
	}

	findPdfViewer(): PdfViewer[] | null {
		const leaves = this.app.workspace.getLeavesOfType("pdf");

		const pdfViewers: PdfViewer[] = [];

		for (const leaf of leaves) {
			const view = leaf.view as any;

			const viewer =
				view?.previewMode?.renderer?.pdfViewer ||
				view?.pdfViewer ||
				view?.viewer?.child?.pdfViewer;

			if (viewer?.eventBus) {
				pdfViewers.push(viewer);
			}
		}

		if (pdfViewers.length > 0) {
			return pdfViewers;
		}

		return null;
	}

	async onStateChange(state: AppState): Promise<void> {
		if (state.isInSubNote) {
			this.subTitleElement.setText(
				`${this.subNoteController.getSubNoteFileName()}`
			);
			this.pageElement.setText(`Page ${state.currentPage}`);
			this.emptyElement.style.display = "none";

			const subNoteContent =
				await this.subNoteController.getSubNoteContent();
			this.editor.show();
			this.editor.set(subNoteContent);
			this.subTitleElement.parentElement?.toggleVisibility(true);
			return;
		}

		if (state.currentPdf !== null && state.currentPdf !== undefined) {
			this.titleElement.setText(`${state.currentPdf.basename}`);
			this.pageElement.setText(`Page ${state.currentPage}`);

			const content = await this.pdfNoteController.getNoteContent();
			this.editor.show();
			this.editor.set(content);
			this.emptyElement.style.display = "none";
			this.buttonDiv.style.display = "block";
			this.subTitleElement.parentElement?.toggleVisibility(false);

			if (this.stateManager.getIsPageMode()) {
				setIcon(this.titleIcon, "file-stack");
			} else {
				setIcon(this.titleIcon, "file");
			}
			
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
		console.log("Closing PDF Note View");
		if (this.unsubscribe) {
			this.unsubscribe();
		}
		this.cleanupPdfEventListeners();
	}
}
