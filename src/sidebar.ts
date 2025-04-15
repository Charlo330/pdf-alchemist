import { App, Notice, setIcon, WorkspaceLeaf } from 'obsidian';
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

	unfocus() {
		if (this.editor) {
			console.log(this.editor)
			if (this.sidebarLeaf?.view) {
				this.sidebarLeaf.view.containerEl.blur();
			}
		}
	}

	async createNotesSidebar() {

		// Vérifie si la barre latérale existe déjà pour éviter de la recréer à chaque clic
		if (!this.sidebarLeaf) {
			this.sidebarLeaf = this.app.workspace.getRightLeaf(false);
		}

		if (!this.sidebarLeaf) return;
		
		setIcon(this.sidebarLeaf.view.containerEl, 'edit');
		this.sidebarLeaf.view.icon = 'edit'

		const container = this.sidebarLeaf.view.containerEl;
		container.empty();
		container.addClass('pdf-notes-sidebar');

		// Ajout d'un titre
		container.createEl('h3', { text: `📝 Notes: ${this.noteService.getFileName()}`, cls: 'pdf-title' });
		const div = container.createDiv({cls: 'pdf-div' });
		this.titlePageElement = div.createEl('h3', { text: `Page ${this.noteService.getCurrentPage()}`, cls: 'pdf-page-note' });
		const refreshButton = div.createEl('button', { cls: 'pdf-button-refresh' });
		refreshButton.addEventListener('click', async () => {
			await this.noteService.refresh();
			this.updateNotesSidebar();
			new Notice('🔄 Notes refreshed');
		});
		setIcon(refreshButton, 'refresh-ccw');
		container.createEl('hr', { cls: 'pdf-notes' });
		const savedNotes = await this.noteService.getSavedNotes(this.noteService.getCurrentPage());

		this.editor = new EmbeddableMarkdownEditor(this.app, container, {
			value: savedNotes,
			placeholder: "Type here...",
			onChange: (update) => {
				if (this.editor) {
					this.noteService.saveNotes(this.noteService.getCurrentPage(), this.editor.value);
				}
			
			},
			onBlur: (editor) => {
				console.log("Éditeur perdu le focus, contenu :", editor.value);
			},
			onSubmit: (editor) => {
			}
		});

		this.sidebarLeaf.view.onunload = () => {
			this.sidebarLeaf = null;
		}

		if (this.sidebarLeaf && this.sidebarLeaf.view) {
			console.log(this.sidebarLeaf.view.getIcon());
		}

		this.app.workspace.revealLeaf(this.sidebarLeaf);

	}

	async updateNotesSidebar() {
		if (!this.sidebarLeaf) return;

		if (this.editor) {
			const content  = await this.noteService.getSavedNotes(this.noteService.getCurrentPage());
			this.editor.value = content as string;
		}

		this.titlePageElement?.setText(`Page ${this.noteService.getCurrentPage()}`);
	}

	emptySidebar() {
		if (this.sidebarLeaf) {
			this.sidebarLeaf.view.containerEl.empty();
			this.sidebarLeaf.view.containerEl.createDiv({ text: '📝 No pdf opened', cls: 'pdf-empty' });
			this.sidebarLeaf.view.containerEl.innerHTML = '📝 No pdf opened';
		}
	}

	detachSidebar() {
		this.sidebarLeaf?.detach();
	}

	isSidebarVisible() {
		return this.sidebarLeaf !== null;
	}

	isEditingNotes(): boolean {
		const activeLeaf = this.app.workspace;
		if (!activeLeaf) return false;
	
		const view = activeLeaf.view;
		return view && view.getViewType() === "markdown" && view.file?.basename.includes("notes");
	}
	

}
