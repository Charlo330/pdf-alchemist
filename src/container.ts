import { Container } from "inversify";
import { StateManager } from "./StateManager";
import { PdfNotesController } from "./controller/PdfNotesController";
import { PdfNotesService } from "./Service/PdfNotesService";
import { INoteRepository } from "./type/INoteRepository";
import { ILinkRepository } from "./type/ILinkRepository";
import { NoteRepository } from "./Repository/NoteRepository";
import { JsonLinkRepository } from "./Repository/JsonLinkRepository";

export const TYPES = {
  App: Symbol.for("App"),
  PdfNotesService: Symbol.for("PdfNotesService"),
  NoteRepository: Symbol.for("NoteRepository"),
  LinkRepository: Symbol.for("LinkRepository"),
  FileSystem: Symbol.for("FileSystem"),
  StateManager: Symbol.for("StateManager"),
  Controller: Symbol.for("Controller"),
};

export const container = new Container();

export function configureContainer(): void {
  // Services de domaine
  container.bind<PdfNotesService>(TYPES.PdfNotesService).to(PdfNotesService);
  container.bind<StateManager>(TYPES.StateManager).to(StateManager).inSingletonScope();
  container.bind<PdfNotesController>(TYPES.Controller).to(PdfNotesController);

  // Repositories
  container.bind<INoteRepository>(TYPES.NoteRepository).to(NoteRepository);
  container.bind<ILinkRepository>(TYPES.LinkRepository).to(JsonLinkRepository);
}
