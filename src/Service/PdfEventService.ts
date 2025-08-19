import { inject } from "inversify";
import { App, TFile, WorkspaceLeaf } from "obsidian";
import { TYPES } from "src/type/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type View = {previewMode? : {renderer?: {pdfViewer?: any}}, pdfViewer?: any, viewer?: {child?: {pdfViewer?: any}}};
type Viewer = {eventBus: {on: (event: string, callback: (event: { pageNumber: number }) => void) => void, off: (event: string, callback: (event: { pageNumber: number }) => void) => void}, _currentPageNumber?: number, pdfViewer?: { _currentPageNumber?: number }};
type PageChangeCallback = (pageNumber: number) => void;

export class PdfEventService {
	private currentPdfViewer: { viewer: Viewer; callback: (event: { pageNumber: number }) => void } | null = null;

	constructor(@inject(TYPES.App) private app: App) {}

	public registerPageChangeListener(file: TFile, callback: PageChangeCallback): void {
		this.cleanup();

		const view = this.getPdfView(file);
		if (!view) return;

		const viewer : Viewer =
			view?.previewMode?.renderer?.pdfViewer ||
			view?.pdfViewer ||
			view?.viewer?.child?.pdfViewer;

		if (!viewer?.eventBus) return;

		const wrappedCallback = (event: { pageNumber: number }) => {
			callback(event.pageNumber);
		};

		viewer.eventBus.on("pagechanging", wrappedCallback);

		this.currentPdfViewer = { viewer, callback: wrappedCallback };

		callback(viewer._currentPageNumber ?? viewer.pdfViewer?._currentPageNumber ?? 1);
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

	private getPdfView(file: TFile): View | undefined {
		return this.app.workspace
			.getLeavesOfType("pdf")
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.find((leaf: WorkspaceLeaf) => (leaf.view as any).file.path === file.path)
			?.view as View;
	}
}
