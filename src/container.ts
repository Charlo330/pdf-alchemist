import { Container } from "inversify";
import { StateManager } from "./StateManager";
import { PdfNotesController } from "./controller/PdfNotesController";
import { PdfNotesService } from "./Service/PdfNotesService";
import { INoteRepository } from "./type/INoteRepository";
import { ILinkRepository } from "./type/ILinkRepository";
import { NoteRepository } from "./Repository/NoteRepository";
import { JsonLinkRepository } from "./Repository/JsonLinkRepository";
import { App, WorkspaceLeaf } from "obsidian";
import { TYPES } from "./type/types";
import { SubNotesController } from "./controller/SubNotesController";
import { PdfNoteView } from "./view/PdfNoteView/PdfNoteView";

export const container = new Container();

// Type pour la factory
export type PdfNoteViewFactory = (leaf: WorkspaceLeaf) => PdfNoteView;

export function configureContainer(app: App): void {
    container.bind<App>(TYPES.App).toConstantValue(app);
    container.bind<StateManager>(TYPES.StateManager).to(StateManager).inSingletonScope();
    container.bind<ILinkRepository>(TYPES.LinkRepository).to(JsonLinkRepository).inSingletonScope();
    container.bind<INoteRepository>(TYPES.NoteRepository).to(NoteRepository);
    container.bind<PdfNotesService>(TYPES.PdfNotesService).to(PdfNotesService).inSingletonScope();
    container.bind<PdfNotesController>(TYPES.PdfNotesController).to(PdfNotesController).inSingletonScope();
    container.bind<SubNotesController>(TYPES.SubNotesController).to(SubNotesController).inSingletonScope();
    
    // Factory pour PdfNoteView
    container.bind<PdfNoteViewFactory>(TYPES.PdfNoteViewFactory).toFactory(() => {
        return (leaf: WorkspaceLeaf) => {
            const controller = container.get<PdfNotesController>(TYPES.PdfNotesController);
			const subController = container.get<SubNotesController>(TYPES.SubNotesController);
            const stateManager = container.get<StateManager>(TYPES.StateManager);

            return new PdfNoteView(leaf, controller, subController, stateManager);
        };
    });
}
