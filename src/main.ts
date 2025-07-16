import { configureContainer, container, TYPES } from "./container";
import { PdfNotesController } from "./controller/PdfNotesController";
import { StateManager } from "./StateManager";

import { Plugin, TFile } from "obsidian";
import { PluginSettings } from "./type/PluginSettings";
import { PDF_NOTE_VIEW, PdfNoteView } from "./view/PdfNoteView";
import { PdfNotesSettingTab } from "./settings/PdfNotesSettingTab";
import { FilePickerModal } from "./view/FilePickerModal";
import { PdfNotesService } from "./Service/PdfNotesService";
import { TimedModal } from "old/TimeModal";

export default class PDFNotesPlugin extends Plugin {
	settings: PluginSettings = {
		folderLocation: "",
		noteTemplate: "# {{title}}\n\n",
		autoCreateNotes: true,
	};

	private controller: PdfNotesController;
	private stateManager: StateManager;
	private unsubscribe: (() => void) | null = null;

	async onload() {
		// Configuration du conteneur DI
		configureContainer();
		container.bind(TYPES.App).toConstantValue(this.app);

		await this.loadSettings();

		// Récupération des services
		this.controller = container.get<PdfNotesController>(TYPES.Controller);
		this.stateManager = container.get<StateManager>(TYPES.StateManager);

		// Enregistrement de la vue
		this.registerView(PDF_NOTE_VIEW, (leaf) => {
			return new PdfNoteView(leaf, this.controller, this.stateManager);
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
				new FilePickerModal(this.app, this.controller).open(),
		});

		// Bouton ribbon
		this.addRibbonIcon("file-text", "Open PDF Notes", () => {
			this.openPdfNotes();
		});

		// Événements
		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				this.controller.onPdfFileChanged(file);
			})
		);

		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (file instanceof TFile) {
					const service = container.get<PdfNotesService>(
						TYPES.PdfNotesService
					);
					if (file.extension === "pdf") {
						service.updatePdfPath(oldPath, file.path);
					} else if (file.extension === "md") {
						service.updateNotePath(oldPath, file.path);
					}
				}
			})
		);

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
										await this.controller.getLinkedNotePath(
											file.path
										);
								} else if (file.extension === "md") {
									linkedPath =
										await this.controller.getLinkedPdfPath(
											file.path
										);
								}
								new TimedModal(this.app, linkedPath).open();
							});
					});
				}
			})
		);

		// Initialisation après le chargement du workspace
		this.app.workspace.onLayoutReady(() => {
			this.initializeAfterLayout();
		});
	}

	async initializeAfterLayout() {
		// Ouvrir automatiquement la vue si un PDF est ouvert
		const currentFile = this.controller.getCurrentPdfFile();
		if (currentFile) {
			await this.controller.onPdfFileChanged(currentFile);
			this.openPdfNotes();
		}

		// Écouter les changements de page PDF
		this.setupPdfEventListeners();
	}

	private setupPdfEventListeners() {
		// Rechercher le viewer PDF et écouter les changements de page
		const findPdfViewer = () => {
			const leaves = this.app.workspace.getLeavesOfType("pdf");
			for (const leaf of leaves) {
				const view = leaf.view as any;
				const viewer =
					view?.previewMode?.renderer?.pdfViewer || view?.pdfViewer;
				if (viewer?.eventBus) {
					return viewer;
				}
			}
			return null;
		};

		const pdfViewer = findPdfViewer();
		if (pdfViewer) {
			pdfViewer.eventBus.on("pagechanging", (event: any) => {
				this.controller.onPageChanged(event.pageNumber);
			});
		}
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
