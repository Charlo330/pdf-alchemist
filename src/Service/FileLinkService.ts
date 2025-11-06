import { inject, injectable } from "inversify";
import { App, TFile } from "obsidian";
import { JsonLinkRepository } from "src/Repository/JsonLinkRepository";
import { StateManager } from "src/StateManager";
import { LinkItem } from "src/type/LinkItem";
import { PaginatedLinks } from "src/type/PaginatedLinks";
import { PdfNoteLink } from "src/type/PdfNoteLink";
import { TYPES } from "src/type/types";

@injectable()
export class FileLinkService {
	constructor(
		@inject(TYPES.LinkRepository) private linkRepo: JsonLinkRepository,
		@inject(TYPES.StateManager) private stateManager: StateManager,
		@inject(TYPES.App) private app: App
	) {}

	async linkPdfToNote(pdfPath: string, notePath: string, isPageMode?: boolean): Promise<void> {
		if (isPageMode == null) {
			isPageMode = this.stateManager.getSettings().isPageMode;
		}

		if (isPageMode === undefined) {
			isPageMode = false;
		}
		
		const link: PdfNoteLink = { pdfPath: pdfPath, notePath: notePath, isPageMode: isPageMode };
		await this.linkRepo.save(link);
	}

	async getLinkedNoteFile(): Promise<TFile | null> {
		const pdfPath = this.stateManager.getCurrentPdf()?.path;
		
		const link = await this.linkRepo.findByPdf(pdfPath ? pdfPath : "");

		const filepath = this.app.vault.getFileByPath(link?.notePath || "");

		return filepath || null;
	}

	async getAllLinks(): Promise<LinkItem[]> {
    try {
        const indexPath = "pdf-note-index.json";
        if (!(await this.app.vault.adapter.exists(indexPath))) {
            return [];
        }

        const content = await this.app.vault.adapter.read(indexPath);
        const index = JSON.parse(content);

        return Object.entries(index).map(([pdfPath, properties]) => {
            const props = properties as {
                notePath: string;
                isPageMode: boolean;
            };
            return {
                pdfPath,
                notePath: props.notePath,
                isPageMode: props.isPageMode,
            };
        });
    } catch (error) {
        console.warn("Failed to load existing links:", error);
        return [];
    }
}

filterLinks(links: LinkItem[], searchTerm: string): LinkItem[] {
    if (!searchTerm) return links;
    
    const term = searchTerm.toLowerCase();
    return links.filter(
        (link) =>
            link.pdfPath.toLowerCase().includes(term) ||
            link.notePath.toLowerCase().includes(term)
    );
}

paginateLinks(links: LinkItem[], page: number, itemsPerPage: number): PaginatedLinks {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, links.length);
    const items = links.slice(startIndex, endIndex);
    
    return {
        items,
        total: links.length,
        page,
        totalPages: Math.ceil(links.length / itemsPerPage)
    };
}

	async getLinkedNotePath(pdfPath: string): Promise<PdfNoteLink | null> {
		const link = await this.linkRepo.findByPdf(pdfPath);
		return link || null;
	}

	async getLinkedPdfPath(notePath: string): Promise<PdfNoteLink | null> {
		const link = await this.linkRepo.findByNote(notePath);
		return link || null;
	}

	async updatePdfPath(oldPath: string, newPath: string): Promise<void> {
		await this.linkRepo.updatePdfPath(oldPath, newPath);
	}

	async updateNotePath(oldPath: string, newPath: string): Promise<void> {
		await this.linkRepo.updateNotePath(oldPath, newPath);
	}

	async deletePdfLink(pdfPath: string): Promise<void> {
		await this.linkRepo.delete(pdfPath);
	}

	async deleteNoteLink(notePath: string): Promise<void> {
		const link = await this.linkRepo.findByNote(notePath);
		if (link) {
			await this.linkRepo.delete(link.pdfPath);
		}
	}
}
