import { Plugin, TFile, Notice, WorkspaceLeaf, MarkdownView, View, App } from 'obsidian';

export default class PDFNotesPlugin extends Plugin {
	file: TFile | null = null;
	currentPage = 1;
	notes: { [key: number]: string } = {}; // Stocke les notes par page
	sidebarLeaf: WorkspaceLeaf | null = null;

	async onload() {
		// Commande pour ouvrir le PDF avec les notes
		this.addCommand({
			id: 'open-pdf-with-notes',
			name: 'Ouvrir le PDF avec annotations',
			callback: async () => await this.openPDFWithNotes(),
		});

		// Ajout d'un bouton dans la barre latérale
		this.addRibbonIcon('file-text', 'Ouvrir PDF avec notes', () => {
			this.openPDFWithNotes();
		});

		// Détection du changement de fichier
		this.app.workspace.on('file-open', (file) => this.onFileChange(file));
	}

	async openPDFWithNotes() {
		await this.getPDFFile();
		if (!this.file) return;

		await this.loadNotesFromFile();
		// 📝 **Créer et afficher la barre latérale**
		await this.createNotesSidebar();

		//const leaf = this.app.workspace.activeLeaf;
		const view : View | null = this.app.workspace.getActiveViewOfType(View);

		if (view && view.viewer?.child?.pdfViewer) {
			const pdfViewer = view.viewer.child.pdfViewer;

			// Ajoute un écouteur d'événement pour détecter le changement de page
			pdfViewer.eventBus.on('pagechanging', (event: any) => {
				const currentPage = event.pageNumber;
				console.log(`Page actuelle : ${currentPage}`);
				this.currentPage = currentPage;
				this.updateNotesSidebar();
			});

			console.log("Écouteur de changement de page ajouté !");
		} else {
			console.error("Impossible de trouver le visualiseur PDF.");
		}


	}

	async getPDFFile() {
		this.file = await this.app.workspace.getActiveFile();
		if (!this.file || this.file.extension !== 'pdf') {
			new Notice('❌ Veuillez ouvrir un fichier PDF');
			this.file = null;
			return;
		}
	}

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
		container.createEl('h3', { text: `📝 Notes: ${this.file.basename}` });

		// Création du champ de texte pour les notes
		const textarea = container.createEl('textarea', {
			cls: 'notes-textarea',
			placeholder: 'Écrivez vos notes ici...',
		});

		textarea.value = await this.getSavedNotes(this.currentPage);

		// Enregistrer les notes automatiquement
		textarea.addEventListener('input', () => this.saveNotes(this.currentPage, textarea.value));

		// Empêche la barre latérale de se fermer en conservant la référence à la feuille
		this.app.workspace.revealLeaf(this.sidebarLeaf);
	}

	async updateNotesSidebar() {
		if (!this.sidebarLeaf) return;

		const textarea = this.sidebarLeaf.view.containerEl.querySelector('.notes-textarea') as HTMLTextAreaElement;
		if (!textarea) return;

		textarea.value = await this.getSavedNotes(this.currentPage);
	}

	async getSavedNotes(page: number): Promise<string> {
		if (!this.file) return '';

		// Récupérer le fichier Markdown associé
		const notesPath = `${this.file.basename}.md`;
		const notesFile = await this.app.vault.getAbstractFileByPath(notesPath);

		if (notesFile && notesFile instanceof TFile) {
			return this.notes[page] || '';
		}

		return '';
	}

	async saveNotes(page: number, content: string) {
		if (!this.file) return;

		this.notes[page] = content;

		// Sauvegarde dans un fichier Markdown
		const notesPath = `${this.file.basename}.md`;
		let notesFile = this.app.vault.getAbstractFileByPath(notesPath) as TFile;

		let notesContent = '';
		for (const [pageNum, text] of Object.entries(this.notes)) {
			notesContent += `## Page ${pageNum}\n${text}\n\n`;
		}

		if (!notesFile) {
			notesFile = await this.app.vault.create(notesPath, notesContent);
		} else {
			await this.app.vault.modify(notesFile, notesContent);
		}
	}

	async loadNotesFromFile() {
		if (!this.file) return;

		const notesPath = `${this.file.basename}.md`;
		const notesFile = await this.app.vault.getAbstractFileByPath(notesPath) as TFile;

		if (notesFile) {
			const content = await this.app.vault.read(notesFile);
			this.notes = this.parseMarkdownNotes(content);
		}
	}

	parseMarkdownNotes(content: string): { [key: number]: string } {
		const notes: { [key: number]: string } = {};
		const matches = content.matchAll(/## Page (\d+)\n([\s\S]*?)(?=\n## Page \d+|\n?$)/g);

		for (const match of matches) {
			const pageNum = parseInt(match[1], 10);
			notes[pageNum] = match[2].trim();
		}

		return notes;
	}

	onFileChange(file: TFile | null) {
		const activeElement = document.activeElement as HTMLElement;
		const isInsideSidebar = this.sidebarLeaf?.view.containerEl.contains(activeElement);

		// Ferme la barre latérale seulement si un fichier différent est ouvert
		// et que l'élément actif n'est PAS dans la barre latérale
		if (!file || file.extension !== 'pdf' || file.path !== this.file?.path) {
			if (!isInsideSidebar && this.sidebarLeaf) {
				this.sidebarLeaf.detach();

				this.sidebarLeaf = null;
			}
		}
		else {
			this.openPDFWithNotes();
		}
	}

	changePage() {
		// Ajoutez ici le code pour changer de page

	}
}
