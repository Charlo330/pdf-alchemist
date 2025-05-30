import { EventRef, Plugin } from "obsidian";
import { container, TYPES } from "./container";
import { NoteService } from "./notes";
import { SidebarService } from "./sidebar";
import { FileService } from "./file";
import { PDF_NOTE_VIEW, PdfNoteView } from "./pdfNoteView";

interface PdfViewer {
	eventBus: {
		on: (event: string, callback: (event: any) => void) => EventRef;
		off: (event: string, callback: (event: any) => void) => void;
	};
}

export default class PDFNotesPlugin extends Plugin {
	pluginOpen = true;
	pdfViewer: PdfViewer | null = null;
	funct = async (event: { pageNumber: number }) => {
			console.log("test1212");
			this.noteService.setCurrentPage(event.pageNumber);
			const leaves = this.app.workspace.getLeavesOfType(PDF_NOTE_VIEW);
			const view = leaves[0].view as PdfNoteView;
			await view.updateNotesSidebar();
		};
	noteService: NoteService;
	sidebarService: SidebarService;
	fileService: FileService;


	async onload() {
		// Fournir dynamiquement l'instance de App
		container.bind(TYPES.App).toConstantValue(this.app);

		// Récupérer les services via Inversify
		this.noteService = container.get<NoteService>(TYPES.NoteService);
		this.sidebarService = container.get<SidebarService>(TYPES.SidebarService);
		this.fileService = container.get<FileService>(TYPES.FileService);

		this.registerView(PDF_NOTE_VIEW, (leaf) => {
			return new PdfNoteView(leaf, this.noteService);
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

		this.app.workspace.onLayoutReady(async () => await this.initializeSidebar());
	}

	async initializeSidebar() {
		const currentFile = this.app.workspace.getActiveFile();

		if (!currentFile) return;

		await this.openPDFWithNotes();

		this.pdfViewer = findPdfViewer();

		this.app.workspace.on("file-open", async (file) => {
			if (!file || this.fileService.pdfFile === file) return;
			console.log("aller");
			this.fileService.changePdfFile(file);
			await this.onFileChange();
		});

		this.pluginOpen = await this.sidebarService.isSidebarOpen();
	}

	async openPDFWithNotes() {
		await this.noteService.loadNotesFromFile();
		await this.sidebarService.createNotesSidebar();
	}

	async onFileChange() {
		if (this.pluginOpen) {
			console.log(this.fileService.isPdfFileOpened())
			if (!this.fileService.isPdfFileOpened()) {
				const leaves = this.app.workspace.getLeavesOfType(PDF_NOTE_VIEW);
				const view = leaves[0].view as PdfNoteView;
				view.emptySidebar();
				return;
			} else {
				console.log("pdfFileOpened")
				await this.openPDFWithNotes();
				await this.changePdf();
				console.log(this.pdfViewer)

				this.detachEvent(this.funct);

				// Ajoute un écouteur d'événement pour détecter le changement de page
				this.attachEvent(this.funct);
			}
		}
	}

	async changePdf() {
		const leaves = this.app.workspace.getLeavesOfType(PDF_NOTE_VIEW);
		const view = leaves[0].view as PdfNoteView;

		view.onOpen();
		view.updateNotesSidebar();
	}

	async attachEvent(fct : (event: { pageNumber: number }) => Promise<void>) {
		const pdfViewer = findPdfViewer();
		pdfViewer?.eventBus.on("pagechanging", await fct);
	}

	async detachEvent(fct : (event: { pageNumber: number }) => Promise<void>) {
		const pdfViewer = findPdfViewer();
		await pdfViewer?.eventBus.off("pagechanging", fct);
	}
}

function findPdfViewer(): PdfViewer | null {
	const leaves = this.app.workspace.getLeavesOfType("pdf");

	for (const leaf of leaves) {
		const view = leaf.view as any;

		// essaie de trouver un pdfViewer injecté dans un composant interne
		const viewer = view?.previewMode?.renderer?.pdfViewer || view?.pdfViewer || view?.viewer?.child?.pdfViewer;

		if (viewer?.eventBus) {
			console.log("✅ pdfViewer trouvé dans leaf", leaf);
			return viewer;
		}
	}

	console.warn("❌ Aucun pdfViewer trouvé dans les feuilles markdown.");
	return null;
}
