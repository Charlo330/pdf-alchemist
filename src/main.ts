import { Plugin, TFile, View } from "obsidian";
import { container, TYPES } from "./container";
import { NoteService } from "./notes";
import { SidebarService } from "./sidebar";
import { FileService } from "./file";

export default class PDFNotesPlugin extends Plugin {
	async onload() {
		// Fournir dynamiquement l'instance de App
		container.bind(TYPES.App).toConstantValue(this.app);

		// Récupérer les services via Inversify
		const noteService = container.get<NoteService>(TYPES.NoteService);
		const sidebarService = container.get<SidebarService>(TYPES.SidebarService);
		const fileService = container.get<FileService>(TYPES.FileService);

		// Commande pour ouvrir le PDF avec les notes
		this.addCommand({
			id: "open-pdf-with-notes",
			name: "Ouvrir le PDF avec annotations",
			callback: async () => {
				await this.openPDFWithNotes(noteService, sidebarService, fileService);
			},
		});

		// Ajout d'un bouton dans la barre latérale
		this.addRibbonIcon("file-text", "Ouvrir PDF avec notes", () => {
			this.openPDFWithNotes(noteService, sidebarService, fileService);
		});
	}

	async openPDFWithNotes(noteService: NoteService, sidebarService: SidebarService, fileService: FileService) {
		await fileService.initialisePdfFile()
		await noteService.loadNotesFromFile();
		await sidebarService.createNotesSidebar();

		const view: View | null = this.app.workspace.getActiveViewOfType(View);

		if (view && view.viewer?.child?.pdfViewer) {
			const pdfViewer = view.viewer.child.pdfViewer;

			// Ajoute un écouteur d'événement pour détecter le changement de page
			pdfViewer.eventBus.on("pagechanging", (event: any) => {
				noteService.setCurrentPage(event.pageNumber);
				sidebarService.updateNotesSidebar();
			});
		} else {
			console.error("Impossible de trouver le visualiseur PDF.");
		}

		this.app.workspace.on("active-leaf-change", async () => {
			this.onFileChange(noteService, sidebarService, fileService);
		});
	}

async onFileChange(noteService: NoteService, sidebarService: SidebarService, fileService: FileService) {
    const file = fileService.getCurrentFocusFile();

    if (!file || file.extension !== 'pdf') {
        if (sidebarService.isSidebarVisible()) {
            sidebarService.detachSidebar();
        }
        return;
    }

    // Vérifier si on a changé de fichier PDF
    const previousFile = fileService.getPdfFile();
    if (!previousFile || previousFile.path !== file.path) {
        await fileService.initialisePdfFile(); // Met à jour le fichier PDF actif
        this.openPDFWithNotes(noteService, sidebarService, fileService);
    }
}

	
}
