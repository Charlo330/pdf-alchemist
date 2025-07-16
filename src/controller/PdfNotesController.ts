import { inject, injectable } from "inversify";
import { App, Notice, TFile } from "obsidian";
import { TYPES } from "src/container";
import { PdfNotesService } from "src/Service/PdfNotesService";
import { StateManager } from "src/StateManager";

@injectable()
export class PdfNotesController {
  constructor(
    @inject(TYPES.PdfNotesService) private pdfNotesService: PdfNotesService,
    @inject(TYPES.StateManager) private stateManager: StateManager,
    @inject(TYPES.App) private app: App
  ) {}

  async onPdfFileChanged(file: TFile | null): Promise<void> {
    if (!file || file.extension !== 'pdf') {
      this.stateManager.setCurrentPdf(null);
      return;
    }

    this.stateManager.setCurrentPdf(file);
  }

  async onPageChanged(page: number): Promise<void> {
    this.stateManager.setCurrentPage(page);
  }

  async saveNote(content: string): Promise<void> {
    const state = this.stateManager.getState();
    if (!state.currentPdf) return;

    await this.pdfNotesService.saveNote();
  }

  async getNoteForCurrentPage(): Promise<string> {
    const state = this.stateManager.getState();
    if (!state.currentPdf) return '';

    const note = await this.pdfNotesService.getNotesForPage(state.currentPage);
    return note || '';
  }

  async linkPdfToNote(pdfPath: string, notePath: string): Promise<void> {
    await this.pdfNotesService.linkPdfToNote(pdfPath, notePath);
    new Notice(`PDF linked to note: ${notePath}`);
  }

  async getLinkedNotePath(pdfPath: string): Promise<string | null> {
    return await this.pdfNotesService.getLinkedNotePath(pdfPath);
  }

  async getLinkedPdfPath(notePath: string): Promise<string | null> {
    return await this.pdfNotesService.getLinkedPdfPath(notePath);
  }

  getCurrentPdfFile(): TFile | null {
    for (const leaf of this.app.workspace.getLeavesOfType("pdf")) {
      const view = leaf.view as any;
      if (view && view.file?.extension === "pdf") {
        return view.file;
      }
    }
    return null;
  }
}
