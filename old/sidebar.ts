import { App, WorkspaceLeaf } from 'obsidian';
import { EmbeddableMarkdownEditor } from 'embeddable-editor';
import { NoteService } from './notes';
import { inject, injectable } from 'inversify';
import { PDF_NOTE_VIEW } from './pdfNoteView';

const TYPES = {
	App: Symbol.for("App"),
	FileService: Symbol.for("FileService"),
	NoteService: Symbol.for("NoteService"),
	SidebarService: Symbol.for("SidebarService"),
};


@injectable()
export class SidebarService {

	private sidebarLeaf: WorkspaceLeaf | null = null;

	constructor(
		@inject(TYPES.App)
		public app: App, 
		@inject(TYPES.NoteService)
		public noteService: NoteService
	) {}

	async createNotesSidebar() {
		let leaf = this.app.workspace.getLeavesOfType(PDF_NOTE_VIEW)[0];

		if (!leaf) {
			leaf = this.app.workspace.getRightLeaf(false) as WorkspaceLeaf;
		}

		this.sidebarLeaf = leaf;

		await leaf?.setViewState({
			type: PDF_NOTE_VIEW,
			active: true,
		});
	
		if (leaf){
			leaf.view.navigation = true;
			this.app.workspace.revealLeaf(leaf);
		}
	}

	async isSidebarOpen(): Promise<boolean> {
		const leaves = this.app.workspace.getLeavesOfType(PDF_NOTE_VIEW);
		return leaves.length > 0;
	}

	detachSidebar() {
		this.sidebarLeaf?.detach();
	}
}
