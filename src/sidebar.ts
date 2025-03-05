import { App, WorkspaceLeaf } from 'obsidian';
import { EmbeddableMarkdownEditor } from 'embeddable-editor';
import { NoteService } from './notes';
import { inject, injectable } from 'inversify';

const TYPES = {
	App: Symbol.for("App"),
	FileService: Symbol.for("FileService"),
	NoteService: Symbol.for("NoteService"),
	SidebarService: Symbol.for("SidebarService"),
};


@injectable()
export class SidebarService {

	private sidebarLeaf: WorkspaceLeaf | null = null;
	private editor: EmbeddableMarkdownEditor | null = null;
	private titlePageElement: HTMLElement | null = null;

	constructor(
		@inject(TYPES.App)
		public app: App, 
		@inject(TYPES.NoteService)
		public noteService: NoteService
	) {}

	async createNotesSidebar() {

		// Vérifie si la barre latérale existe déjà pour éviter de la recréer à chaque clic
		if (!this.sidebarLeaf) {
			this.sidebarLeaf = this.app.workspace.getRightLeaf(false);
		}
		
		if (!this.sidebarLeaf) return;

		const container = this.sidebarLeaf.view.containerEl;
		container.empty();
		container.addClass('pdf-notes-sidebar');

		// Ajout d'un titre
		container.createEl('h3', { text: `📝 Notes: ${this.noteService.getFileName()}`, cls: 'pdf-title' });
		this.titlePageElement = container.createEl('h3', { text: `Page ${this.noteService.getCurrentPage()}`, cls: 'pdf-page-note' });
		container.createEl('hr', { cls: 'pdf-notes' });
		const savedNotes = await this.noteService.getSavedNotes(this.noteService.getCurrentPage());

		this.editor = new EmbeddableMarkdownEditor(this.app, container, {
			value: savedNotes,
			placeholder: "Type here...",
			onChange: (update) => {
				if (this.editor)
					this.noteService.saveNotes(this.noteService.getCurrentPage(), this.editor.value);
			},
			onBlur: (editor) => {
				console.log("Éditeur perdu le focus, contenu :", editor.value);
			},
			onSubmit: (editor) => {
			}
		});

		// Empêche la barre latérale de se fermer en conservant la référence à la feuille
		this.app.workspace.revealLeaf(this.sidebarLeaf);
	}

	async updateNotesSidebar() {
		console.log(this.sidebarLeaf)
		if (!this.sidebarLeaf) return;

		if (this.editor) {
			this.editor.value = await this.noteService.getSavedNotes(this.noteService.getCurrentPage()) as string;
		}

		this.titlePageElement?.setText(`Page ${this.noteService.getCurrentPage()}`);
	}

}
