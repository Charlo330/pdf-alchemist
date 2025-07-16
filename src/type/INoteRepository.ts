export interface INoteRepository {
  save(pdfPath: string, page: number, content: string): Promise<void>;
  findByPage(page: number): Promise<string | null>;
  delete(noteId: string): Promise<void>;
  parseMarkdownContent(content: string): Map<number, string>;
  generateMarkdownContent(notes: string[]): string;
}
