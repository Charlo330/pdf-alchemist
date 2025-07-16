import { App, Modal } from "obsidian";
import { FileTypeEnum, FolderSuggest } from "./FolderSuggest";
import { PdfNotesController } from "src/controller/PdfNotesController";

export class FilePickerModal extends Modal {
  constructor(
    app: App,
    private controller: PdfNotesController
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const h2 = contentEl.createEl("h2", {
      text: "Link PDF to Markdown Note",
    });
    h2.style.textAlign = "center";

    const inputContainer = contentEl.createDiv({
      cls: "file-picker-input",
    });

    const pdfInput = inputContainer.createEl("input", {
      type: "text",
      placeholder: "PDF File Path",
      cls: "file-picker-input-field",
    });

    const mdInput = inputContainer.createEl("input", {
      type: "text",
      placeholder: "Markdown File Path",
      cls: "file-picker-input-field",
    });

    new FolderSuggest(this.app, pdfInput, FileTypeEnum.PDF);
    new FolderSuggest(this.app, mdInput, FileTypeEnum.MARKDOWN);

    const btn = inputContainer.createEl("button", { text: "Link Files" });
    btn.onclick = async () => {
      if (pdfInput.value && mdInput.value) {
        await this.controller.linkPdfToNote(pdfInput.value, mdInput.value);
        this.close();
      }
    };
  }

  onClose() {
    this.contentEl.empty();
  }
}
