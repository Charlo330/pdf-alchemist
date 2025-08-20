import {
	configureContainer,
	container,
	FilePickerModalFactory,
	PdfNoteViewFactory,
} from "./container";

import { Plugin, TFile } from "obsidian";
import { PluginSettings } from "./type/PluginSettings";
import { PDF_NOTE_VIEW } from "./view/PdfNoteView";
import { PdfNotesSettingTab } from "./settings/PdfNotesSettingTab";
import { FilePickerModal } from "./view/FilePickerModal";
import { TYPES } from "./type/types";
import { NoteRepository } from "./Repository/NoteRepository";
import { StateManager } from "./StateManager";
import { PdfNoteViewController } from "./controller/PdfNoteViewController";

export default class PDFNotesPlugin extends Plugin {
	settings: PluginSettings = {
		autoCreateNotes: true,
		folderLocation: "sameFolder",
		folderLocationPath: null,
		isPageMode: true,
	};

	private stateManager: StateManager;
	private pdfNoteViewController: PdfNoteViewController;

	private unsubscribe: (() => void) | null = null;

	async onload() {
		configureContainer(this.app);

		const pdfNoteViewFactory = container.get<PdfNoteViewFactory>(
			TYPES.PdfNoteViewFactory
		);

		this.stateManager = container.get<StateManager>(TYPES.StateManager);
		this.pdfNoteViewController = container.get<PdfNoteViewController>(
			TYPES.PdfNoteViewController
		);

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
			callback: () => this.openFilePickerModal(),
		});

		this.addRibbonIcon("wand-sparkles", "Open PDF Notes", () => {
			this.openPdfNotes();
		});

		this.app.workspace.onLayoutReady(async () => {
			await this.initializeAfterLayout();

			this.registerEvent(
				this.app.vault.on("rename", (file, oldPath) => {
					console.log("renamed", file.path)
					this.pdfNoteViewController.updateFilesPath(file, oldPath);
				})
			);

			this.registerEvent(
				this.app.vault.on("delete", async (file) => {
					if (file instanceof TFile) {
						await this.pdfNoteViewController.deleteLink(file);
					}
				})
			);
		});
	}

	private openFilePickerModal(path?: string): FilePickerModal {
		const modal = container.get<FilePickerModalFactory>(
			TYPES.FilePickerModalFactory
		)(path);
		modal.open();
		return modal;
	}

	async initializeAfterLayout() {
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
			const noteRepo = container.get<NoteRepository>(
				TYPES.NoteRepository
			);
			noteRepo.initialize();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, this.settings, await this.loadData());
		this.stateManager.setSettings(this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.stateManager.setSettings(this.settings);
	}

	onunload() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}
}
