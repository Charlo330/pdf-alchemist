import { Container } from "inversify";
import { StateManager } from "./StateManager";
import { PdfNotesController } from "./controller/PdfNotesController";
import { PdfNotesService } from "./Service/PdfNotesService";
import { INoteRepository } from "./type/INoteRepository";
import { ILinkRepository } from "./type/ILinkRepository";
import { NoteRepository } from "./Repository/NoteRepository";
import { JsonLinkRepository } from "./Repository/JsonLinkRepository";
import { App } from "obsidian";
import { TYPES } from "./type/types";

export const container = new Container();

export function configureContainer(app: App): void {
container.bind<App>(TYPES.App).toConstantValue(app); // très important
container.bind<StateManager>(TYPES.StateManager).to(StateManager).inSingletonScope();
container.bind<ILinkRepository>(TYPES.LinkRepository).to(JsonLinkRepository).inSingletonScope();
container.bind<INoteRepository>(TYPES.NoteRepository).to(NoteRepository);
container.bind<PdfNotesService>(TYPES.PdfNotesService).to(PdfNotesService).inSingletonScope();
container.bind<PdfNotesController>(TYPES.Controller).to(PdfNotesController).inSingletonScope();
}
