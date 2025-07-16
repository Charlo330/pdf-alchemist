import { Container } from "inversify";
import { FileService } from "./file";
import { NoteService } from "./notes";
import { SidebarService } from "./sidebar";

export const TYPES = {
	App: Symbol.for("App"),
	FileService: Symbol.for("FileService"),
	NoteService: Symbol.for("NoteService"),
	SidebarService: Symbol.for("SidebarService"),
};

export const container = new Container();

container.bind<FileService>(TYPES.FileService).to(FileService).inSingletonScope();
container.bind<NoteService>(TYPES.NoteService).to(NoteService).inSingletonScope();
container.bind<SidebarService>(TYPES.SidebarService).to(SidebarService).inSingletonScope();
