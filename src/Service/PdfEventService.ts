import { inject } from "inversify";
import { App, TFile, WorkspaceLeaf } from "obsidian";
import { TYPES } from "src/type/types";

type PageChangeCallback = (pageNumber: number) => void;

export class PdfEventService {
	private currentPdfViewer: { viewer: any; callback: any } | null = null;

	constructor(@inject(TYPES.App) private app: App) {}

	public registerPageChangeListener(file: TFile, callback: PageChangeCallback): void {
		this.cleanup();

		const view = this.getPdfView(file);
		if (!view) return;

		const viewer =
			view?.previewMode?.renderer?.pdfViewer ||
			view?.pdfViewer ||
			view?.viewer?.child?.pdfViewer;

		if (!viewer?.eventBus) return;

		const wrappedCallback = (event: { pageNumber: number }) => {
			callback(event.pageNumber);
		};

		viewer.eventBus.on("pagechanging", wrappedCallback);

		this.currentPdfViewer = { viewer, callback: wrappedCallback };

		// Appel initial avec la page actuelle
		callback(viewer._currentPageNumber ?? viewer.pdfViewer?._currentPageNumber);
	}

	public cleanup(): void {
		const viewer = this.currentPdfViewer?.viewer;
		const callback = this.currentPdfViewer?.callback;

		if (viewer?.eventBus && callback) {
			try {
				viewer.eventBus.off("pagechanging", callback);
			} catch (error) {
				console.warn("Error during page changing event cleanup", error);
			}
		}

		this.currentPdfViewer = null;
	}

	private getPdfView(file: TFile): any {
		return this.app.workspace
			.getLeavesOfType("pdf")
			.find((leaf: WorkspaceLeaf) => leaf.view?.file?.path === file.path)
			?.view;
	}
}
