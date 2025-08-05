import { injectable, inject } from "inversify";
import { App, Notice, TFile } from "obsidian";
import { FileLinkService } from "src/Service/FileLinkService";
import { CreateLinkRequest } from "src/type/CreateLinkRequest";
import { DeleteLinkRequest } from "src/type/DeleteLinkRequest";
import { LinkItem } from "src/type/LinkItem";
import { TYPES } from "src/type/types";

@injectable()
export class FilePickerModalController {
    constructor(
        @inject(TYPES.App) private app: App,
        @inject(TYPES.FileLinkService) private fileLinkService: FileLinkService
    ) {}

    async createLink(request: CreateLinkRequest): Promise<boolean> {
        try {
            if (!request.pdfPath.trim() || !request.notePath.trim()) {
                new Notice("Please fill in both PDF and Markdown file paths.");
                return false;
            }

            // Validation des fichiers
            const pdfFile = this.getFile(request.pdfPath);
            const noteFile = this.getFile(request.notePath);
            
            if (!pdfFile) {
                new Notice("PDF file not found.");
                return false;
            }
            
            if (pdfFile.extension !== "pdf") {
                new Notice("Selected file is not a PDF.");
                return false;
            }
            
            if (noteFile && noteFile.extension !== "md") {
                new Notice("Selected note file is not a Markdown file.");
                return false;
            }

            await this.fileLinkService.linkPdfToNote(request.pdfPath, request.notePath);
            new Notice(`PDF linked to note: ${request.notePath}`);
            return true;
        } catch (error) {
            new Notice(`Failed to create link: ${error.message}`);
            return false;
        }
    }

    async deleteLink(request: DeleteLinkRequest): Promise<boolean> {
        try {
            const file = this.getFile(request.linkItem.pdfPath);
            if (!file) {
                new Notice("File not found");
                return false;
            }

            if (file.extension === "pdf") {
                await this.fileLinkService.deletePdfLink(file.path);
                new Notice(`Link to PDF deleted: ${file.path}`);
            } else if (file.extension === "md") {
                const pdfPath = await this.fileLinkService.getLinkedPdfPath(file.path);
                if (pdfPath) {
                    await this.fileLinkService.deleteNoteLink(file.path);
                    new Notice(`Link to note deleted: ${file.path}`);
                } else {
                    new Notice(`No linked PDF found for note: ${file.path}`);
                    return false;
                }
            }
            return true;
        } catch (error) {
            new Notice(`Failed to delete link: ${error.message}`);
            return false;
        }
    }

    async getAllLinks(): Promise<LinkItem[]> {
        try {
            return await this.fileLinkService.getAllLinks();
        } catch (error) {
            new Notice(`Failed to load links: ${error.message}`);
            return [];
        }
    }

    filterLinks(links: LinkItem[], searchTerm: string): LinkItem[] {
        return this.fileLinkService.filterLinks(links, searchTerm);
    }

    paginateLinks(links: LinkItem[], page: number, itemsPerPage: number) {
        return this.fileLinkService.paginateLinks(links, page, itemsPerPage);
    }

    validateFilePath(path: string): boolean {
        return path.trim().length > 0;
    }

    private getFile(filePath: string): TFile | null {
        const file = this.app.vault.getAbstractFileByPath(filePath);
        return file instanceof TFile ? file : null;
    }
}
