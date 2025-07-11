import { EventRef, Plugin, TFile } from "obsidian";
import { container, TYPES } from "./container";
import { NoteService } from "./notes";
import { SidebarService } from "./sidebar";
import { FileService } from "./file";
import { PDF_NOTE_VIEW, PdfNoteView } from "./pdfNoteView";
import { ExampleSettingTab } from "./ExampleSettingTab";
import { FilePickerModal } from "./FilePickerModal";
import { TimedModal } from "./TimeModal";

interface PdfViewer {
	eventBus: {
		on: (event: string, callback: (event: any) => void) => EventRef;
		off: (event: string, callback: (event: any) => void) => void;
	};
}

export default class PDFNotesPlugin extends Plugin {
	saveSettings() {
		throw new Error("Method not implemented.");
	}
	pluginOpen = true;
	pdfViewer: PdfViewer | null = null;
	funct = async (event: { pageNumber: number }) => {
		this.noteService.setCurrentPage(event.pageNumber);
		const leaves = this.app.workspace.getLeavesOfType(PDF_NOTE_VIEW);
		const view = leaves[0].view as PdfNoteView;

		await view.updateNotesSidebar();
	};
	noteService: NoteService;
	sidebarService: SidebarService;
	fileService: FileService;
	settings: any;

	async onload() {
		// Fournir dynamiquement l'instance de App
		container.bind(TYPES.App).toConstantValue(this.app);

		// Récupérer les services via Inversify
		this.noteService = container.get<NoteService>(TYPES.NoteService);
		this.sidebarService = container.get<SidebarService>(
			TYPES.SidebarService
		);
		this.fileService = container.get<FileService>(TYPES.FileService);

		this.settings = Object.assign(
			{ folderLocation: "" },
			await this.loadData()
		);

		this.addSettingTab(new ExampleSettingTab(this.app, this));

		this.registerView(PDF_NOTE_VIEW, (leaf) => {
			return new PdfNoteView(leaf, this.noteService, this.fileService);
		});

		// Commande pour ouvrir le PDF avec les notes
		this.addCommand({
			id: "open-pdf-with-notes",
			name: "Ouvrir le PDF avec annotations",
			callback: async () => {
				this.pluginOpen = !this.pluginOpen;
				await this.openPDFWithNotes();
			},
		});

		this.addCommand({
			id: "open-file-picker-modal",
			name: "Relier un fichier via popover",
			callback: () => {
				new FilePickerModal(this.app, this, this.fileService).open();
			},
		});

		// Ajout d'un bouton dans la barre latérale
		this.addRibbonIcon("wand-sparkles", "Open pdf with notes", () => {
			this.pluginOpen = !this.pluginOpen;
			if (this.pluginOpen) {
				this.openPDFWithNotes();
				this.attachEvent(this.funct);
			} else {
				this.sidebarService.detachSidebar();

				this.detachEvent(this.funct);
			}
		});

		this.app.workspace.onLayoutReady(
			async () => await this.initializeSidebar()
		);

		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (file instanceof TFile && file.extension === "md") {
					if (!this.fileService.isNotePdfLinked(oldPath)) return;

					this.fileService.pdfNoteLinker?.updateNotePathInIndex(
						oldPath,
						file.path
					);
				}
				if (file instanceof TFile && file.extension === "pdf") {
					this.fileService.pdfNoteLinker?.updatePdfPathInIndex(
						oldPath,
						file.path
					);
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				menu.addItem((item) => {
					item.setTitle("See linked note")
						.setIcon("zap") // icône Obsidian (facultatif)
						.onClick(async () => {
							let link = null;
							if ((file instanceof TFile) && file.extension == "pdf") {
								link = await this.fileService.pdfNoteLinker?.getNoteForPdf(file.path)
							} else if (file instanceof TFile && file.extension == "md") {
								link = await this.fileService.pdfNoteLinker?.getPdfForNote(file.path)
							}

							if (link !== undefined) {
								new TimedModal(this.app, link).open();
							}
						});
				});
			})
		);
	}

	async initializeSidebar() {
		const currentFile = this.app.workspace.getActiveFile();

		if (!currentFile) return;

		await this.openPDFWithNotes();

		this.pdfViewer = findPdfViewer();

		this.app.workspace.on("file-open", async (file) => {
			if (!file || this.fileService.pdfFile === file) return;

			await this.fileService.changePdfFile(file);
			await this.onFileChange(file);
		});

		this.pluginOpen = await this.sidebarService.isSidebarOpen();
	}

	async onFileChange(file: TFile) {
		if (this.pluginOpen) {
			if (file.extension !== "pdf") {
				const leaves =
					this.app.workspace.getLeavesOfType(PDF_NOTE_VIEW);
				const view = leaves[0].view as PdfNoteView;
				view.emptySidebar();
				return;
			} else {
				//this.noteService.openPdfInCenter(this.app, file);
				await this.openPDFWithNotes();
				await this.changePdf();
				this.detachEvent(this.funct);

				// Ajoute un écouteur d'événement pour détecter le changement de page
				this.attachEvent(this.funct);
			}
		}
	}

	async openPDFWithNotes() {
		await this.noteService.loadNotesFromFile();
		await this.sidebarService.createNotesSidebar();
	}

	async changePdf() {
		const leaves = this.app.workspace.getLeavesOfType(PDF_NOTE_VIEW);
		const view = leaves[0].view as PdfNoteView;

		view.onOpen();
		view.updateNotesSidebar();
	}

	async attachEvent(fct: (event: { pageNumber: number }) => Promise<void>) {
		const pdfViewer = findPdfViewer();
		pdfViewer?.eventBus.on("pagechanging", await fct);
	}

	async detachEvent(fct: (event: { pageNumber: number }) => Promise<void>) {
		const pdfViewer = findPdfViewer();
		await pdfViewer?.eventBus.off("pagechanging", fct);
	}
}

function findPdfViewer(): PdfViewer | null {
	const leaves = this.app.workspace.getLeavesOfType("pdf");

	for (const leaf of leaves) {
		const view = leaf.view as any;

		// essaie de trouver un pdfViewer injecté dans un composant interne
		const viewer =
			view?.previewMode?.renderer?.pdfViewer ||
			view?.pdfViewer ||
			view?.viewer?.child?.pdfViewer;

		if (viewer?.eventBus) {
			console.log("✅ pdfViewer trouvé dans leaf", leaf);
			return viewer;
		}
	}

	console.warn("❌ Aucun pdfViewer trouvé dans les feuilles markdown.");
	return null;
}
