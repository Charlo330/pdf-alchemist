import { Plugin, TFile, View } from "obsidian";
import { container, TYPES } from "./container";
import { NoteService } from "./notes";
import { SidebarService } from "./sidebar";
import { FileService } from "./file";

export default class PDFNotesPlugin extends Plugin {
	pluginOpen = false;
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
				this.pluginOpen = !this.pluginOpen;
				await this.openPDFWithNotes(noteService, sidebarService, fileService);
			},
		});

		// Ajout d'un bouton dans la barre latérale
		this.addRibbonIcon("wand-sparkles", "Open pdf with notes", () => {
			this.pluginOpen = !this.pluginOpen;
			if (this.pluginOpen) {
				this.openPDFWithNotes(noteService, sidebarService, fileService);
			} else {
				sidebarService.detachSidebar();
			}
		});

		this.app.workspace.on("file-open", async (file) => {
			if (!file) return;
			await this.onFileChange(file, noteService, sidebarService, fileService);
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
	}

	async onFileChange(file: TFile, noteService: NoteService, sidebarService: SidebarService, fileService: FileService) {
		if (this.pluginOpen) {
			if (!file || file.extension !== 'pdf') {
				if (!file || file.extension !== 'pdf' || file.path !== fileService.getPdfFile()?.path) {
					sidebarService.emptySidebar();
					return;
				}
			} else {
				if (file != fileService.getPdfFile()) {
					await this.openPDFWithNotes(noteService, sidebarService, fileService);
				}
			}
		}
	}

	async onunload() {
		console.log("Unloading PDF Notes");
	}
}
