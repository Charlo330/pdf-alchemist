import { Container } from "inversify";
import { StateManager } from "./StateManager";
import { PdfNotesService } from "./Service/PdfNotesService";
import { NoteRepository } from "./Repository/NoteRepository";
import { JsonLinkRepository } from "./Repository/JsonLinkRepository";
import { App, WorkspaceLeaf } from "obsidian";
import { TYPES } from "./type/types";
import { PdfNoteView } from "./view/PdfNoteView";
import { FileLinkService } from "./Service/FileLinkService";
import { PdfNoteViewController } from "./controller/PdfNoteViewController";
import { PdfEventService } from "./Service/PdfEventService";
import { BrokenLinkModalController } from "./controller/BrokenLinkModalController";
import { FilePickerModalController } from "./controller/FilePickerModalController";
import { BrokenLinkModal } from "./view/BrokenLinkModal";
import { FilePickerModal } from "./view/FilePickerModal";

export const container = new Container();

// Type for the factory
export type PdfNoteViewFactory = (leaf: WorkspaceLeaf) => PdfNoteView;
export type FilePickerModalFactory = (path: string | undefined) => FilePickerModal;
export type BrokenLinkModalFactory = (path: string) => BrokenLinkModal;

export function configureContainer(app: App): void {
	container.bind<App>(TYPES.App).toConstantValue(app);
	container
		.bind<StateManager>(TYPES.StateManager)
		.to(StateManager)
		.inSingletonScope();
	container
		.bind<JsonLinkRepository>(TYPES.LinkRepository)
		.to(JsonLinkRepository)
		.inSingletonScope();
	container.bind<NoteRepository>(TYPES.NoteRepository).to(NoteRepository);
	container
		.bind<PdfNotesService>(TYPES.PdfNotesService)
		.to(PdfNotesService)
		.inSingletonScope();
	container
		.bind<FileLinkService>(TYPES.FileLinkService)
		.to(FileLinkService)
		.inSingletonScope();
	container
		.bind<PdfNoteViewController>(TYPES.PdfNoteViewController)
		.to(PdfNoteViewController)
		.inSingletonScope();
	container
		.bind<PdfEventService>(TYPES.PdfEventService)
		.to(PdfEventService)
		.inSingletonScope();
	container
		.bind<BrokenLinkModalController>(TYPES.BrokenLinkModalController)
		.to(BrokenLinkModalController)
		.inSingletonScope();
	container
		.bind<FilePickerModalController>(TYPES.FilePickerModalController)
		.to(FilePickerModalController)
		.inSingletonScope();

	// Factory for the PdfNoteView
	container
		.bind<PdfNoteViewFactory>(TYPES.PdfNoteViewFactory)
		.toFactory(() => {
			return (leaf: WorkspaceLeaf) => {
				const stateManager = container.get<StateManager>(
					TYPES.StateManager
				);
				const pdfNoteViewController =
					container.get<PdfNoteViewController>(
						TYPES.PdfNoteViewController
					);

				return new PdfNoteView(
					leaf,
					stateManager,
					pdfNoteViewController
				);
			};
		});

	// Factory for the FilePickerModalController
	container
		.bind<FilePickerModalFactory>(TYPES.FilePickerModalFactory)
		.toFactory(() => {
			return (path: string | undefined) => {
				const app = container.get<App>(TYPES.App);
				const filePickerModalController = container.get<FilePickerModalController>(
					TYPES.FilePickerModalController
				);
				return new FilePickerModal(app, filePickerModalController, path);
			};
		});

	// Factory for the BrokenLinkModal
	container
		.bind<BrokenLinkModalFactory>(TYPES.BrokenLinkModalFactory)
		.toFactory(() => {
			return (path: string) => {
				const app = container.get<App>(TYPES.App);
				const brokenLinkModalController =
					container.get<BrokenLinkModalController>(
						TYPES.BrokenLinkModalController
					);
					
				return new BrokenLinkModal(
					app,
					brokenLinkModalController,
					path,
				);
			};
		});
	}
