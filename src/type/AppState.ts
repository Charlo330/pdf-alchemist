import { TFile } from "obsidian";
import { PdfNoteLink } from "./PdfNoteLink";

export interface AppState {
  currentPdf: TFile | null;
  currentPage: number;
  links: Map<string, PdfNoteLink>;
  navigationStack: string[];
  isInSubNote: boolean;
  settings: any;
}
