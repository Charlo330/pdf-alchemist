import { App } from "obsidian";
import { FileService } from "./file";
import { NoteService } from "./notes";
import { SidebarService } from "./sidebar";

export class ServiceFactory {
	private static fileService: FileService;
	private static noteService: NoteService;
	private static sideBarService: SidebarService;

	static init(app: App) {
		this.fileService = new FileService(app);
		this.noteService = new NoteService(app, this.fileService);
		this.sideBarService = new SidebarService(app, this.noteService);
	}

	static getFileService(): FileService {
		return this.fileService;
	}

	static getNoteService(): NoteService {
		return this.noteService;
	}

	static getSidebarService(): SidebarService {
		return this.sideBarService;
	}
}
