import { injectable } from "inversify";
import { AppState } from "./type/AppState";
import { TFile } from "obsidian";
import { PluginSettings } from "./type/PluginSettings";

@injectable()
export class StateManager {
	private state: AppState = {
		currentPdf: null,
		currentPage: 1,
		links: new Map(),
		navigationStack: [],
		isInSubNote: false,
		isPageMode: null,
		settings: null,
	};

	private listeners: Set<(state: AppState) => void> = new Set();

	getState(): AppState {
		return { ...this.state };
	}

	getCurrentPdf(): TFile | null {
		return this.state.currentPdf;
	}

	getCurrentPage(): number {
		return this.state.currentPage;
	}

	setCurrentPage(page: number): void {
		if (this.state.currentPage !== page) {
			this.state.currentPage = page;
			this.notifyListeners();
		}
	}

	setCurrentPdf(pdf: TFile | null): void {
		if (this.state.currentPdf !== pdf) {
			this.state.currentPdf = pdf;
			this.state.currentPage = 1;
			this.state.navigationStack = [];
			this.state.isInSubNote = false;
			this.notifyListeners();
		}
	}

	getSettings() {
		return this.state.settings;
	}

	setSettings(settings: PluginSettings): void {
		this.state.settings = settings;
	}

	getIsPageMode(): boolean | null {
		return this.state.isPageMode;
	}
	
	setIsPageMode(isPageMode: boolean | null): void {
		this.state.isPageMode = isPageMode;
	}

	pushToNavigationStack(path: string): void {
		this.state.isInSubNote = true;
		this.state.navigationStack.push(path);
		this.notifyListeners();
	}

	popFromNavigationStack(): string | undefined {
		this.state.navigationStack.pop();
		if (
			this.peekNavigationStack() == null ||
			this.peekNavigationStack() === undefined
		) {
			this.state.isInSubNote = false;
		}
		this.notifyListeners();
		return this.peekNavigationStack();
	}

	peekNavigationStack(): string | undefined {
		return this.state.navigationStack[
			this.state.navigationStack.length - 1
		];
	}

	setInSubNote(inSubNote: boolean): void {
		if (this.state.isInSubNote !== inSubNote) {
			this.state.isInSubNote = inSubNote;
			this.notifyListeners();
		}
	}

	subscribe(listener: (state: AppState) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notifyListeners(): void {
		this.listeners.forEach((listener) => listener(this.state));
	}
}
