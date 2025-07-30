import { App, Modal, Notice, setIcon } from "obsidian";
import { FileTypeEnum, FolderSuggest } from "./FolderSuggest";
import { PdfNotesController } from "src/controller/PdfNotesController";

interface LinkItem {
	pdfPath: string;
	notePath: string;
}

export class FilePickerModal extends Modal {
	private allLinks: LinkItem[] = [];
	private filteredLinks: LinkItem[] = [];
	private currentPage = 1;
	private itemsPerPage = 10;
	private searchTerm = "";
	private linksContainer: HTMLElement;
	private paginationContainer: HTMLElement;
	private searchInput: HTMLInputElement;

	constructor(
		app: App,
		private controller: PdfNotesController,
		private pdfPath: string | null = null
	) {
		super(app);
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("file-picker-modal");

		// Load all existing links
		await this.loadAllLinks();
		this.createLinkForm();
		this.createSearchBar();
		this.createLinksSection();
		this.createPagination();

		this.filterAndDisplayLinks();
	}

	private async loadAllLinks(): Promise<void> {
		try {
			// Read the JSON index file to get all links
			const indexPath = "pdf-note-index.json";
			if (await this.app.vault.adapter.exists(indexPath)) {
				const content = await this.app.vault.adapter.read(indexPath);
				const index = JSON.parse(content);
				
				this.allLinks = Object.entries(index).map(([pdfPath, notePath]) => ({
					pdfPath,
					notePath: notePath as string
				}));
			}
		} catch (error) {
			console.warn("Failed to load existing links:", error);
			this.allLinks = [];
		}
	}

	private createLinkForm(): void {
		const formSection = this.contentEl.createEl("div", { cls: "link-form-section" });
		
		formSection.createEl("h3", { text: "Create New Link", cls: "section-title" });

		const inputContainer = formSection.createDiv({
			cls: "file-picker-input",
		});

		const pdfInput = inputContainer.createEl("input", {
			type: "text",
			placeholder: "PDF File Path",
			cls: "file-picker-input-field",
			value: this.pdfPath || "",
		}) as HTMLInputElement;

		const mdInput = inputContainer.createEl("input", {
			type: "text",
			placeholder: "Markdown File Path",
			cls: "file-picker-input-field",
		}) as HTMLInputElement;

		if (this.pdfPath) {
			pdfInput.readOnly = true;
			mdInput.focus();
		} else {
			new FolderSuggest(this.app, pdfInput, FileTypeEnum.PDF);
		}

		new FolderSuggest(this.app, mdInput, FileTypeEnum.MARKDOWN);

		const buttonContainer = inputContainer.createDiv({ cls: "button-container" });
		const linkBtn = buttonContainer.createEl("button", { 
			text: "Create Link",
			cls: "mod-cta"
		});
		
		linkBtn.onclick = async () => {
			if (pdfInput.value && mdInput.value) {
				await this.controller.linkPdfToNote(pdfInput.value, mdInput.value);
				await this.loadAllLinks(); // Reload links
				this.filterAndDisplayLinks(); // Refresh display
				pdfInput.value = this.pdfPath || "";
				mdInput.value = "";
				new Notice("Link created successfully!");
				this.close();
			} else {
				new Notice("Please fill in both PDF and Markdown file paths.");
			}
		};

		// Add separator
		this.contentEl.createEl("hr", { cls: "modal-separator" });
	}

	private createSearchBar(): void {
		const searchSection = this.contentEl.createEl("div", { cls: "search-section" });
		searchSection.createEl("h3", { text: "Existing Links", cls: "section-title" });

		const searchContainer = searchSection.createDiv({ cls: "search-container" });
		
		this.searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: "Search links by PDF or Note path...",
			cls: "search-input"
		}) as HTMLInputElement;

		this.searchInput.addEventListener("input", () => {
			this.searchTerm = this.searchInput.value.toLowerCase();
			this.currentPage = 1; // Reset to first page
			this.filterAndDisplayLinks();
		});

		const clearBtn = searchContainer.createEl("button", {
			text: "Clear",
			cls: "search-clear-btn"
		});

		clearBtn.onclick = () => {
			this.searchInput.value = "";
			this.searchTerm = "";
			this.currentPage = 1;
			this.filterAndDisplayLinks();
		};
	}

	private createLinksSection(): void {
		this.linksContainer = this.contentEl.createEl("div", { cls: "links-container" });
	}

	private createPagination(): void {
		this.paginationContainer = this.contentEl.createEl("div", { cls: "pagination-container" });
	}

	private filterAndDisplayLinks(): void {
		// Filter links based on search term
		this.filteredLinks = this.allLinks.filter(link => 
			link.pdfPath.toLowerCase().includes(this.searchTerm) ||
			link.notePath.toLowerCase().includes(this.searchTerm)
		);

		this.displayCurrentPage();
		this.updatePagination();
	}

	private displayCurrentPage(): void {
		this.linksContainer.empty();

		const startIndex = (this.currentPage - 1) * this.itemsPerPage;
		const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredLinks.length);
		const currentPageLinks = this.filteredLinks.slice(startIndex, endIndex);

		currentPageLinks.forEach((link, index) => {
			this.createLinkItem(link, startIndex + index);
		});

		// Show results info
		const resultsInfo = this.linksContainer.createEl("div", { cls: "results-info" });
		resultsInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${this.filteredLinks.length} links`;
	}

	private createLinkItem(link: LinkItem, index: number): void {
		const linkItem = this.linksContainer.createEl("div", { cls: "link-item" });

		const linkInfo = linkItem.createEl("div", { cls: "link-info" });
		
		const pdfDiv = linkInfo.createEl("div", { cls: "link-path pdf-path" });
		pdfDiv.createEl("span", { text: "PDF: ", cls: "path-label" });
		pdfDiv.createEl("span", { text: link.pdfPath, cls: "path-value" });

		const arrowDiv = linkInfo.createEl("div", { cls: "link-arrow" });
		arrowDiv.textContent = "→";

		const noteDiv = linkInfo.createEl("div", { cls: "link-path note-path" });
		noteDiv.createEl("span", { text: "Note: ", cls: "path-label" });
		noteDiv.createEl("span", { text: link.notePath, cls: "path-value" });

		const actionsDiv = linkItem.createEl("div", { cls: "link-actions" });
		
		const deleteBtn = actionsDiv.createEl("button", {
			text: "Delete",
			cls: "mod-cta delete-btn"
		});

		setIcon(deleteBtn, "trash");

		deleteBtn.onclick = async () => {
			if (confirm(`Are you sure you want to delete the link between:\n${link.pdfPath}\n↓\n${link.notePath}`)) {
				const file  = this.controller.getFile(link.pdfPath)
				await this.controller.deleteLink(file);
				await this.loadAllLinks();
				this.filterAndDisplayLinks();
			}
		};

		// Add hover effects
		linkItem.addEventListener("mouseenter", () => {
			linkItem.addClass("link-item-hover");
		});

		linkItem.addEventListener("mouseleave", () => {
			linkItem.removeClass("link-item-hover");
		});
	}

	private updatePagination(): void {
		this.paginationContainer.empty();

		if (this.filteredLinks.length <= this.itemsPerPage) {
			return; // No pagination needed
		}

		const totalPages = Math.ceil(this.filteredLinks.length / this.itemsPerPage);
		const paginationDiv = this.paginationContainer.createEl("div", { cls: "pagination" });

		// Previous button
		const prevBtn = paginationDiv.createEl("button", {
			text: "Previous",
			cls: this.currentPage === 1 ? "pagination-btn disabled" : "pagination-btn"
		});

		prevBtn.disabled = this.currentPage === 1;
		prevBtn.onclick = () => {
			if (this.currentPage > 1) {
				this.currentPage--;
				this.filterAndDisplayLinks();
			}
		};

		// Page numbers
		const startPage = Math.max(1, this.currentPage - 2);
		const endPage = Math.min(totalPages, this.currentPage + 2);

		if (startPage > 1) {
			const firstBtn = paginationDiv.createEl("button", {
				text: "1",
				cls: "pagination-btn page-number"
			});
			firstBtn.onclick = () => {
				this.currentPage = 1;
				this.filterAndDisplayLinks();
			};

			if (startPage > 2) {
				paginationDiv.createEl("span", { text: "...", cls: "pagination-dots" });
			}
		}

		for (let i = startPage; i <= endPage; i++) {
			const pageBtn = paginationDiv.createEl("button", {
				text: i.toString(),
				cls: i === this.currentPage ? "pagination-btn page-number active" : "pagination-btn page-number"
			});

			pageBtn.onclick = () => {
				this.currentPage = i;
				this.filterAndDisplayLinks();
			};
		}

		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				paginationDiv.createEl("span", { text: "...", cls: "pagination-dots" });
			}

			const lastBtn = paginationDiv.createEl("button", {
				text: totalPages.toString(),
				cls: "pagination-btn page-number"
			});
			lastBtn.onclick = () => {
				this.currentPage = totalPages;
				this.filterAndDisplayLinks();
			};
		}

		// Next button
		const nextBtn = paginationDiv.createEl("button", {
			text: "Next",
			cls: this.currentPage === totalPages ? "pagination-btn disabled" : "pagination-btn"
		});

		nextBtn.disabled = this.currentPage === totalPages;
		nextBtn.onclick = () => {
			if (this.currentPage < totalPages) {
				this.currentPage++;
				this.filterAndDisplayLinks();
			}
		};

		// Page info
		const pageInfo = this.paginationContainer.createEl("div", { cls: "page-info" });
		pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
	}

	onClose() {
		this.contentEl.empty();
	}
}
