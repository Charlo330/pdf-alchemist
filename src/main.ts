import { configureContainer, container, PdfNoteViewFactory } from "./container";
import { PdfNotesController } from "./controller/PdfNotesController";

import { EventRef, Plugin, TFile } from "obsidian";
import { PluginSettings } from "./type/PluginSettings";
import { PDF_NOTE_VIEW } from "./view/PdfNoteView/PdfNoteView";
import { PdfNotesSettingTab } from "./settings/PdfNotesSettingTab";
import { FilePickerModal } from "./view/FilePickerModal";
import { TYPES } from "./type/types";
import { NoteRepository } from "./Repository/NoteRepository";
import { FileLinkedModal } from "./view/FileLinkedModal";

interface PdfViewer {
	eventBus: {
		on: (event: string, callback: (event: any) => void) => EventRef;
		off: (event: string, callback: (event: any) => void) => void;
	};
}

export default class PDFNotesPlugin extends Plugin {
	settings: PluginSettings = {
		folderLocation: "",
		noteTemplate: "# {{title}}\n\n",
		autoCreateNotes: true,
	};

	private pdfNoteController: PdfNotesController;
	private unsubscribe: (() => void) | null = null;
	private currentPdfEventListeners: Array<{
		viewer: PdfViewer;
		callback: (event: { pageNumber: number }) => void;
	}> = [];

	async onload() {
		// Configuration du conteneur DI
		await this.loadSettings();
		configureContainer(this.app);

		this.pdfNoteController = container.get<PdfNotesController>(
			TYPES.PdfNotesController
		);

		const pdfNoteViewFactory = container.get<PdfNoteViewFactory>(
			TYPES.PdfNoteViewFactory
		);

		// Enregistrement de la vue
		this.registerView(PDF_NOTE_VIEW, (leaf) => {
			return pdfNoteViewFactory(leaf);
		});

		// Onglet de paramètres
		this.addSettingTab(new PdfNotesSettingTab(this.app, this));

		// Commandes
		this.addCommand({
			id: "open-pdf-notes",
			name: "Open PDF Notes",
			callback: () => this.openPdfNotes(),
		});

		this.addCommand({
			id: "link-pdf-to-note",
			name: "Link PDF to Note",
			callback: () =>
				new FilePickerModal(this.app, this.pdfNoteController).open(),
		});

		// Bouton ribbon
		this.addRibbonIcon("file-text", "Open PDF Notes", () => {
			this.openPdfNotes();
		});

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
				this.pdfNoteController.updateFilesPath(file, oldPath);
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file instanceof TFile) {
					this.pdfNoteController.deleteLink(file);
				}
			})
		);

		// Initialisation après le chargement du workspace
		this.app.workspace.onLayoutReady(async () => {
			await this.initializeAfterLayout();
		});
	}

	async initializeAfterLayout() {
		// Ouvrir automatiquement la vue si un PDF est ouvert
		const currentFile = this.pdfNoteController.getCurrentPdfFile();
		if (currentFile) {
			await this.pdfNoteController.onPdfFileChanged(currentFile);
			this.openPdfNotes();
		}

		const noteRepo = container.get<NoteRepository>(TYPES.NoteRepository);

		noteRepo.initialize();

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				console.log("Layout changed, setting up PDF event listeners.");
				this.setupChangePageEventListeners();
			})
		);

		// Événements
		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				this.pdfNoteController.onPdfFileChanged(file);
				this.setupChangePageEventListeners();
				console.log("📄 Fichier ouvert:", file?.path);
			})
		);

		// Écouter les changements de page PDF
		this.setupChangePageEventListeners();
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
				// Créer une fonction callback qu'on peut référencer
				const callback = async (event: { pageNumber: number }) => {
					console.log("📄 Page changing:", event.pageNumber);
					this.pdfNoteController.onPageChanged(event.pageNumber);
				};

				// Enregistrer l'événement
				viewer.eventBus.on("pagechanging", callback);

				// Stocker la référence pour pouvoir la supprimer
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
					console.warn("❌ Erreur lors de la suppression:", error);
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
				console.log("✅ pdfViewer trouvé dans leaf", leaf);
				pdfViewers.push(viewer);
			}
		}

		if (pdfViewers.length > 0) {
			return pdfViewers;
		}

		console.warn("Aucun pdfViewer trouvé dans les feuilles markdown.");
		return null;
	}

	async openPdfNotes() {
		const existing = this.app.workspace.getLeavesOfType(PDF_NOTE_VIEW);
		if (existing.length > 0) {
			this.app.workspace.revealLeaf(existing[0]);
			return;
		}

		const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: PDF_NOTE_VIEW,
				active: true,
			});
			this.app.workspace.revealLeaf(leaf);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, this.settings, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}
}
