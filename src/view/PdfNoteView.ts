import { ItemView, Notice, setIcon, TFile, WorkspaceLeaf } from "obsidian";
import {
	createEmbeddableMarkdownEditor,
	EmbeddableMarkdownEditor,
} from "embeddable-editor";
import { AppState } from "src/type/AppState";
import { StateManager } from "src/StateManager";
import { injectable } from "inversify";
import { FileLinkedModal } from "./FileLinkedModal";
import { PdfNoteViewController } from "src/controller/PdfNoteViewController";

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
	private lockBtn: HTMLButtonElement;
	private lockBtnState = false;

	constructor(
		leaf: WorkspaceLeaf,
		private stateManager: StateManager,
		private pdfNoteViewController: PdfNoteViewController
	) {
		super(leaf);
	}

	getViewType(): string {
		return PDF_NOTE_VIEW;
	}

	getDisplayText(): string {
		return "PDF Notes";
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

		setIcon(this.titleIcon, this.pdfNoteViewController.getPageModeIcon());

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
			this.pdfNoteViewController.previousSubNote();
		};

		const homeButton = this.buttonDiv.createEl("button", {
			text: "Home",
			cls: "navigation-button",
		});

		homeButton.onclick = () => {
			this.pdfNoteViewController.mainNote();
		};

		setIcon(backButton, "chevron-left");

		setIcon(homeButton, "home");

		const pageDiv = navDiv.createDiv("pdf-container-page");

		this.lockBtn = this.pdfNoteViewController.createLockButton(pageDiv);

		this.lockBtn.onclick = () => {
			this.lockBtnState = !this.lockBtnState;
			this.pdfNoteViewController.togglePageMode(
				this.lockBtnState,
				this.lockBtn
			);
		};

		this.pageElement = pageDiv.createEl("h5", {
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
					this.pdfNoteViewController.saveSubNote(this.editor.value);
				} else {
					this.pdfNoteViewController.saveNote(this.editor.value);
				}
			},
			onClickLink: async (event) => {
				const target = event.target as HTMLAnchorElement;

				if (target.parentElement?.hasClass("cm-link-alias")) {
					new Notice("You cannot open a link alias. Give it its real name.");
					return;
				}

				console.log("target", target)

				if (target.textContent) {
					await this.pdfNoteViewController.openSubNote(
						target.textContent
					);
				}
			},
			cls: "pdf-editor",
		});

		this.unsubscribe = this.stateManager.subscribe(
			this.onStateChange.bind(this)
		);

		this.onStateChange(this.stateManager.getState());

		const file = this.stateManager.getCurrentPdf();
		console.log("Current PDF file:", file);
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
										await this.pdfNoteViewController.getLinkedNotePath(
											file.path
										);
								} else if (file.extension === "md") {
									linkedPath =
										await this.pdfNoteViewController.getLinkedPdfPath(
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
				this.pdfNoteViewController.updateFilesPath(file, oldPath);
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", async (file) => {
				if (file instanceof TFile) {
					console.log("File deleted:", file);
					await this.pdfNoteViewController.deleteLink(file);
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("file-open", async (file) => {
				console.log("File opened:", file);
				await this.pdfNoteViewController.onPdfFileChanged(file);
				this.lockBtnState = false;
				setIcon(this.lockBtn, "lock-open");
				this.lockBtn.style.color = "var(--green)";
				if (file) {
					this.pdfNoteViewController.startListeningToPageChange(file);
				}
			})
		);

		this.app.workspace.onLayoutReady(() => {
			const file = this.stateManager.getCurrentPdf();
			if (file) {
				this.pdfNoteViewController.startListeningToPageChange(file);
			}
		});
	}

	async onStateChange(state: AppState): Promise<void> {
		const { isInSubNote, currentPdf, currentPage } = state;

		this.pageElement.setText(currentPage ? `Page ${currentPage}` : "");

		if (isInSubNote) {
			await this.displaySubNoteView();
			return;
		}

		if (currentPdf) {
			await this.displayPdfNoteView(currentPdf);
		} else {
			this.displayEmptyView();
		}
	}
	private async displaySubNoteView(): Promise<void> {
		this.subTitleElement.setText(
			this.pdfNoteViewController.getSubNoteFileName() || "Sub Note"
		);
		this.emptyElement.style.display = "none";
		this.subTitleElement.parentElement?.toggleVisibility(true);
		this.lockBtn.hide();

		const subNoteContent = await this.pdfNoteViewController.getSubNoteContent();
		this.editor.show();
		this.editor.set(subNoteContent);
	}

	private async displayPdfNoteView(file: TFile): Promise<void> {
		this.titleElement.setText(file.basename);
		this.emptyElement.style.display = "none";
		this.buttonDiv.style.display = "block";
		this.subTitleElement.parentElement?.toggleVisibility(false);
		this.titleIcon.show();

		const content = await this.pdfNoteViewController.getNoteContent();
		this.editor.show();
		this.editor.set(content);

		if (this.stateManager.getIsPageMode()) {
			setIcon(this.titleIcon, "file-stack");
			this.lockBtn.show();
		} else {
			setIcon(this.titleIcon, "file");
			this.lockBtn.hide();
		}
	}

	private displayEmptyView(): void {
		this.titleElement.setText("PDF Alchemist 🪄");
		this.pageElement.setText("");
		this.editor.hide();
		this.editor.set("");
		this.emptyElement.style.display = "block";
		this.buttonDiv.style.display = "none";
		this.subTitleElement.parentElement?.toggleVisibility(false);
		this.titleIcon.hide();
		this.lockBtn.hide();
	}

	async onClose() {
		console.log("Closing PDF Note View");
		if (this.unsubscribe) {
			this.unsubscribe();
		}
		this.pdfNoteViewController.cleanupPageChangeListener();
	}
}
