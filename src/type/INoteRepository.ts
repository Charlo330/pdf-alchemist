import { TFile } from "obsidian";

export interface INoteRepository {
  save(note: TFile): Promise<void>;
  findByPage(page: number): Promise<string | null>;
  delete(noteId: string): Promise<void>;
  parseMarkdownContent(content: string): Map<number, string>;
  generateMarkdownContent(notes: string[]): string;
}
