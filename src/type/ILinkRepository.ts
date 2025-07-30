import { PdfNoteLink } from "./PdfNoteLink";

export interface ILinkRepository {
  save(link: PdfNoteLink): Promise<void>;
  findByPdf(pdfPath: string): Promise<PdfNoteLink | null>;
  findByNote(notePath: string): Promise<PdfNoteLink | null>;
  delete(pdfPath: string): Promise<void>;
  updatePdfPath(oldPath: string, newPath: string): Promise<void>;
  updateNotePath(oldPath: string, newPath: string): Promise<void>;
}
