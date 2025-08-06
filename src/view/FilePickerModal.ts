import { App, Modal, setIcon } from "obsidian";
import { FileTypeEnum, FolderSuggest } from "./FolderSuggest";
import { FilePickerModalController } from "src/controller/FilePickerModalController";
import { MODAL_CONFIG } from "src/settings/ModalConfig";
import { LinkItem } from "src/type/LinkItem";

interface SearchState {
    term: string;
    currentPage: number;
}

export class FilePickerModal extends Modal {
    private allLinks: LinkItem[] = [];
    private searchState: SearchState = { term: "", currentPage: 1 };
    
    // UI Elements
    private linksContainer: HTMLElement;
    private paginationContainer: HTMLElement;
    private searchInput: HTMLInputElement;
    private pageModeToggle: HTMLInputElement;
    private isLoading = false;

    constructor(
        app: App,
        private controller: FilePickerModalController,
        private pdfPath: string | null = null
    ) {
        super(app);
    }

    async onOpen() {
        this.contentEl.empty();
        this.contentEl.addClass(MODAL_CONFIG.CLASSES.MODAL);

        await this.initializeData();
        this.render();
    }

    private async initializeData(): Promise<void> {
        try {
            this.allLinks = await this.controller.getAllLinks();
        } catch (error) {
            console.error("Failed to load links:", error);
            this.allLinks = [];
        }
    }

    private render(): void {
        if (this.isLoading) return;
        
        this.contentEl.empty();
        this.contentEl.addClass(MODAL_CONFIG.CLASSES.MODAL);
        
        this.renderLinkForm();
        this.renderSeparator();
        this.renderSearchSection();
        this.renderLinksSection();
        this.renderPagination();
        
        this.updateDisplay();
    }

    private renderLinkForm(): void {
        const formSection = this.contentEl.createEl("div", {
            cls: MODAL_CONFIG.CLASSES.FORM_SECTION,
        });

        formSection.createEl("h3", {
            text: MODAL_CONFIG.TEXTS.CREATE_NEW_LINK,
            cls: MODAL_CONFIG.CLASSES.SECTION_TITLE,
        });

        const inputContainer = formSection.createDiv({
            cls: MODAL_CONFIG.CLASSES.INPUT_CONTAINER,
        });

        const { pdfInput, mdInput } = this.createInputFields(inputContainer);
        this.createPageModeToggle(inputContainer);
        this.createSubmitButton(inputContainer, pdfInput, mdInput);
    }

    private createInputFields(container: HTMLElement) {
        const pdfInput = container.createEl("input", {
            type: "text",
            placeholder: MODAL_CONFIG.TEXTS.PDF_PLACEHOLDER,
            cls: MODAL_CONFIG.CLASSES.INPUT_FIELD,
            value: this.pdfPath || "",
        }) as HTMLInputElement;

        const mdInput = container.createEl("input", {
            type: "text",
            placeholder: MODAL_CONFIG.TEXTS.MD_PLACEHOLDER,
            cls: MODAL_CONFIG.CLASSES.INPUT_FIELD,
        }) as HTMLInputElement;

        this.setupInputBehavior(pdfInput, mdInput);
        
        return { pdfInput, mdInput };
    }

    private createPageModeToggle(container: HTMLElement): void {
        const toggleContainer = container.createDiv({
            cls: "page-mode-toggle-container",
        });

        const toggleWrapper = toggleContainer.createDiv({
            cls: "page-mode-toggle-wrapper",
        });

        const label = toggleWrapper.createEl("label", {
            text: "Page Mode",
            cls: "page-mode-toggle-label",
        });

        const toggleDiv = toggleWrapper.createDiv({
            cls: "page-mode-toggle-input-wrapper",
        });

        this.pageModeToggle = toggleDiv.createEl("input", {
            type: "checkbox",
            cls: "page-mode-toggle-input",
        }) as HTMLInputElement;

        // Set default value based on current settings or default to true
        this.pageModeToggle.checked = this.controller.getDefaultPageMode();

        const description = toggleContainer.createDiv({
            cls: "page-mode-description",
        });

        description.createEl("span", {
            text: "Enable to create separate notes for each PDF page. Disable for a single note per PDF.",
            cls: "page-mode-description-text",
        });

        // Add icon to make it more visual
        const iconSpan = label.createSpan({ cls: "page-mode-icon" });
        
        // Update icon based on toggle state
        const updateIcon = () => {
            setIcon(iconSpan, this.pageModeToggle.checked ? "file-stack" : "file");
        };
        
        updateIcon();
        
        this.pageModeToggle.addEventListener("change", updateIcon);
    }

    private setupInputBehavior(pdfInput: HTMLInputElement, mdInput: HTMLInputElement): void {
        if (this.pdfPath) {
            pdfInput.readOnly = true;
            mdInput.focus();
        } else {
            new FolderSuggest(this.app, pdfInput, FileTypeEnum.PDF);
        }
        new FolderSuggest(this.app, mdInput, FileTypeEnum.MARKDOWN);

        // Validation en temps réel
        pdfInput.addEventListener("blur", () => this.validateInput(pdfInput));
        mdInput.addEventListener("blur", () => this.validateInput(mdInput));
    }

    private validateInput(input: HTMLInputElement): void {
        const isValid = this.controller.validateFilePath(input.value);
        input.classList.toggle("input-error", !isValid);
    }

    private createSubmitButton(container: HTMLElement, pdfInput: HTMLInputElement, mdInput: HTMLInputElement): void {
        const buttonContainer = container.createDiv({
            cls: MODAL_CONFIG.CLASSES.BUTTON_CONTAINER,
        });
        
        const linkBtn = buttonContainer.createEl("button", {
            text: MODAL_CONFIG.TEXTS.CREATE_LINK,
            cls: "mod-cta",
        });

        linkBtn.onclick = async () => {
            linkBtn.disabled = true;
            
            try {
                const success = await this.controller.createLink({
                    pdfPath: pdfInput.value,
                    notePath: mdInput.value,
                    isPageMode: this.pageModeToggle.checked
                });

                if (success) {
                    await this.refreshData();
                    this.resetForm(pdfInput, mdInput);
                    this.close();
                }
            } finally {
                linkBtn.disabled = false;
                linkBtn.textContent = MODAL_CONFIG.TEXTS.CREATE_LINK;
            }
        };
    }

    private resetForm(pdfInput: HTMLInputElement, mdInput: HTMLInputElement): void {
        pdfInput.value = this.pdfPath || "";
        mdInput.value = "";
        pdfInput.classList.remove("input-error");
        mdInput.classList.remove("input-error");
        // Reset toggle to default
        this.pageModeToggle.checked = this.controller.getDefaultPageMode();
    }

    private renderSeparator(): void {
        this.contentEl.createEl("hr", { cls: "modal-separator" });
    }

    private renderSearchSection(): void {
        const searchSection = this.contentEl.createEl("div", {
            cls: MODAL_CONFIG.CLASSES.SEARCH_SECTION,
        });
        
        searchSection.createEl("h3", {
            text: MODAL_CONFIG.TEXTS.EXISTING_LINKS,
            cls: MODAL_CONFIG.CLASSES.SECTION_TITLE,
        });

        const searchContainer = searchSection.createDiv({
            cls: MODAL_CONFIG.CLASSES.SEARCH_CONTAINER,
        });

        this.createSearchInput(searchContainer);
        this.createClearButton(searchContainer);
    }

    private createSearchInput(container: HTMLElement): void {
        this.searchInput = container.createEl("input", {
            type: "text",
            placeholder: MODAL_CONFIG.TEXTS.SEARCH_PLACEHOLDER,
            cls: MODAL_CONFIG.CLASSES.SEARCH_INPUT,
        }) as HTMLInputElement;

        // Debounced search
        let searchTimeout: NodeJS.Timeout;
        this.searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchState.term = this.searchInput.value.toLowerCase();
                this.searchState.currentPage = 1;
                this.updateDisplay();
            }, 300);
        });
    }

    private createClearButton(container: HTMLElement): void {
        const clearBtn = container.createEl("button", {
            text: MODAL_CONFIG.TEXTS.CLEAR,
            cls: "search-clear-btn",
        });

        clearBtn.onclick = () => {
            this.searchInput.value = "";
            this.searchState.term = "";
            this.searchState.currentPage = 1;
            this.updateDisplay();
        };
    }

    private renderLinksSection(): void {
        this.linksContainer = this.contentEl.createEl("div", {
            cls: MODAL_CONFIG.CLASSES.LINKS_CONTAINER,
        });
    }

    private renderPagination(): void {
        this.paginationContainer = this.contentEl.createEl("div", {
            cls: MODAL_CONFIG.CLASSES.PAGINATION_CONTAINER,
        });
    }

    private updateDisplay(): void {
        const filteredLinks = this.controller.filterLinks(this.allLinks, this.searchState.term);
        const paginatedData = this.controller.paginateLinks(
            filteredLinks,
            this.searchState.currentPage,
            MODAL_CONFIG.PAGINATION.ITEMS_PER_PAGE
        );

        this.displayLinks(paginatedData);
        this.displayPagination(paginatedData);
    }

    private displayLinks(data: any): void {
        this.linksContainer.empty();

        if (data.items.length === 0) {
            this.linksContainer.createEl("div", {
                text: data.total === 0 ? "No links found." : "No links match your search.",
                cls: "no-results"
            });
            return;
        }

        data.items.forEach((link: LinkItem) => {
            this.createLinkItem(link);
        });

        // Show results info
        const resultsInfo = this.linksContainer.createEl("div", {
            cls: "results-info",
        });
        const start = (data.page - 1) * MODAL_CONFIG.PAGINATION.ITEMS_PER_PAGE + 1;
        const end = Math.min(data.page * MODAL_CONFIG.PAGINATION.ITEMS_PER_PAGE, data.total);
        resultsInfo.textContent = `Showing ${start}-${end} of ${data.total} links`;
    }

    private createLinkItem(link: LinkItem): void {
        const linkItem = this.linksContainer.createEl("div", {
            cls: "link-item",
        });

        this.createLinkInfo(linkItem, link);
        this.createLinkActions(linkItem, link);
        this.addLinkItemHoverEffects(linkItem);
    }

    private createLinkInfo(container: HTMLElement, link: LinkItem): void {
        const linkInfo = container.createEl("div", { cls: "link-info" });

        const pdfDiv = linkInfo.createEl("div", { cls: "link-path pdf-path" });
        pdfDiv.createEl("span", { text: "PDF: ", cls: "path-label" });
        pdfDiv.createEl("span", { text: link.pdfPath, cls: "path-value" });
        
        const arrowDiv = linkInfo.createEl("div", { cls: "link-arrow" });
        arrowDiv.textContent = "→";

        const noteDiv = linkInfo.createEl("div", { cls: "link-path note-path" });
        noteDiv.createEl("span", { text: "Note: ", cls: "path-label" });
        noteDiv.createEl("span", { text: link.notePath, cls: "path-value" });
        
        // Add page mode indicator
        const modeDiv = linkInfo.createEl("div", { cls: "link-mode" });
        const modeIcon = modeDiv.createSpan({ cls: "mode-icon" });
        setIcon(modeIcon, link.isPageMode ? "file-stack" : "file");
        modeDiv.createSpan({ 
            text: link.isPageMode ? "Page Mode" : "Single Note",
            cls: "mode-text"
        });
    }

    private createLinkActions(container: HTMLElement, link: LinkItem): void {
        const actionsDiv = container.createEl("div", { cls: "link-actions" });

        const deleteBtn = actionsDiv.createEl("button", {
            text: MODAL_CONFIG.TEXTS.DELETE,
            cls: "mod-cta delete-btn",
        });

        setIcon(deleteBtn, "trash");

        deleteBtn.onclick = async () => {
            if (this.confirmDeletion(link)) {
                deleteBtn.disabled = true;
                deleteBtn.textContent = "Deleting...";
                
                try {
                    const success = await this.controller.deleteLink({ linkItem: link });
                    if (success) {
                        await this.refreshData();
                    }
                } finally {
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = MODAL_CONFIG.TEXTS.DELETE;
                    setIcon(deleteBtn, "trash");
                }
            }
        };
    }

    private confirmDeletion(link: LinkItem): boolean {
        const modeText = link.isPageMode ? "Page Mode" : "Single Note";
        return confirm(
            `Are you sure you want to delete the link between:\n${link.pdfPath}\n↓\n${link.notePath}\n(${modeText})`
        );
    }

    private addLinkItemHoverEffects(linkItem: HTMLElement): void {
        linkItem.addEventListener("mouseenter", () => {
            linkItem.addClass("link-item-hover");
        });

        linkItem.addEventListener("mouseleave", () => {
            linkItem.removeClass("link-item-hover");
        });
    }

    private displayPagination(data: any): void {
        this.paginationContainer.empty();

        if (data.totalPages <= 1) {
            return;
        }

        const paginationDiv = this.paginationContainer.createEl("div", {
            cls: "pagination",
        });

        this.createPaginationButtons(paginationDiv, data);
        this.createPageInfo(data);
    }

    private createPaginationButtons(container: HTMLElement, data: any): void {
        this.createPreviousButton(container, data);
        this.createPageNumberButtons(container, data);
        this.createNextButton(container, data);
    }

    private createPreviousButton(container: HTMLElement, data: any): void {
        const prevBtn = container.createEl("button", {
            text: MODAL_CONFIG.TEXTS.PREVIOUS,
            cls: data.page === 1 ? "pagination-btn disabled" : "pagination-btn",
        });

        prevBtn.disabled = data.page === 1;
        prevBtn.onclick = () => {
            if (data.page > 1) {
                this.searchState.currentPage--;
                this.updateDisplay();
            }
        };
    }

    private createPageNumberButtons(container: HTMLElement, data: any): void {
        const startPage = Math.max(1, data.page - 2);
        const endPage = Math.min(data.totalPages, data.page + 2);

        if (startPage > 1) {
            this.createPageButton(container, 1, data.page);
            if (startPage > 2) {
                container.createEl("span", { text: "...", cls: "pagination-dots" });
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            this.createPageButton(container, i, data.page);
        }

        if (endPage < data.totalPages) {
            if (endPage < data.totalPages - 1) {
                container.createEl("span", { text: "...", cls: "pagination-dots" });
            }
            this.createPageButton(container, data.totalPages, data.page);
        }
    }

    private createPageButton(container: HTMLElement, pageNum: number, currentPage: number): void {
        const pageBtn = container.createEl("button", {
            text: pageNum.toString(),
            cls: pageNum === currentPage
                ? "pagination-btn page-number active"
                : "pagination-btn page-number",
        });

        pageBtn.onclick = () => {
            this.searchState.currentPage = pageNum;
            this.updateDisplay();
        };
    }

    private createNextButton(container: HTMLElement, data: any): void {
        const nextBtn = container.createEl("button", {
            text: MODAL_CONFIG.TEXTS.NEXT,
            cls: data.page === data.totalPages ? "pagination-btn disabled" : "pagination-btn",
        });

        nextBtn.disabled = data.page === data.totalPages;
        nextBtn.onclick = () => {
            if (data.page < data.totalPages) {
                this.searchState.currentPage++;
                this.updateDisplay();
            }
        };
    }

    private createPageInfo(data: any): void {
        const pageInfo = this.paginationContainer.createEl("div", {
            cls: "page-info",
        });
        pageInfo.textContent = `Page ${data.page} of ${data.totalPages}`;
    }

    private async refreshData(): Promise<void> {
        try {
            this.allLinks = await this.controller.getAllLinks();
            this.updateDisplay();
        } catch (error) {
            console.error("Failed to refresh data:", error);
        }
    }

    onClose() {
        this.contentEl.empty();
    }
	
}
