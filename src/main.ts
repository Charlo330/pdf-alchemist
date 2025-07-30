import { configureContainer, container, PdfNoteViewFactory } from "./container";
import { PdfNotesController } from "./controller/PdfNotesController";

import { Plugin } from "obsidian";
import { PluginSettings } from "./type/PluginSettings";
import { PDF_NOTE_VIEW } from "./view/PdfNoteView";
import { PdfNotesSettingTab } from "./settings/PdfNotesSettingTab";
import { FilePickerModal } from "./view/FilePickerModal";
import { TYPES } from "./type/types";
import { NoteRepository } from "./Repository/NoteRepository";
import { StateManager } from "./StateManager";

export default class PDFNotesPlugin extends Plugin {
	settings: PluginSettings = {
		autoCreateNotes: true,
		folderLocation: "sameFolder",
		folderLocationPath: null,
		isPageMode: true
	};

	private pdfNoteController: PdfNotesController;
	private stateManager: StateManager;

	private unsubscribe: (() => void) | null = null;

	async onload() {
		configureContainer(this.app);

		this.pdfNoteController = container.get<PdfNotesController>(
			TYPES.PdfNotesController
		);

		const pdfNoteViewFactory = container.get<PdfNoteViewFactory>(
			TYPES.PdfNoteViewFactory
		);

		this.stateManager = container.get<StateManager>(TYPES.StateManager);

		await this.loadSettings();

		this.registerView(PDF_NOTE_VIEW, (leaf) => {
			return pdfNoteViewFactory(leaf);
		});

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

		this.addRibbonIcon("wand-sparkles", "Open PDF Notes", () => {
			this.openPdfNotes();
		});


		this.app.workspace.onLayoutReady(async () => {
			await this.initializeAfterLayout();
		});
	}

	async initializeAfterLayout() {
		// Onglet de paramètres
		this.addSettingTab(new PdfNotesSettingTab(this.app, this));
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
			const noteRepo = container.get<NoteRepository>(TYPES.NoteRepository);
			noteRepo.initialize();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, this.settings, await this.loadData());
		console.log("load", this.settings)
		this.stateManager.setSettings(this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log("settings", this.settings)
		this.stateManager.setSettings(this.settings);
	}

	onunload() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}
}
