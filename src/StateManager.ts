import { injectable } from "inversify";
import { AppState } from "./type/AppState";
import { TFile } from "obsidian";

@injectable()
export class StateManager {
  private state: AppState = {
    currentPdf: null,
    currentPage: 1,
    links: new Map(),
    navigationStack: [],
    isInSubNote: false
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

  pushToNavigationStack(path: string): void {
    this.state.navigationStack.push(path);
    this.notifyListeners();
  }

  popFromNavigationStack(): string | undefined {
    const result = this.state.navigationStack.pop();
    this.notifyListeners();
    return result;
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
    this.listeners.forEach(listener => listener(this.state));
  }
}
