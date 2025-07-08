import { App, Modal, Setting } from "obsidian";
import { FolderSuggest } from "./FolderSuggest"; // ou FileSuggest si adapté

export class FilePickerModal extends Modal {
  plugin: any; // ton plugin

  constructor(app: App, plugin: any) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const h2 = contentEl.createEl("h2", { text: "Repair PDF Markdown Link" });
    h2.style.textAlign = "center";

	const inputContainer = contentEl.createDiv({ cls: "file-picker-input" });
	
	new FolderSuggest(this.app, inputContainer.createEl("input", {
		type: "text",
		placeholder: "PDF Path",
		cls: "file-picker-input-field"
	}));

	new FolderSuggest(this.app, inputContainer.createEl("input", {
		type: "text",
		placeholder: "Markdown Path",
		cls: "file-picker-input-field"
	}));

    const btn = inputContainer.createEl("button", { text: "Validate" });
    btn.onclick = () => {
      const input = contentEl.querySelector("input");
      if (input) {
        const val = (input as HTMLInputElement).value;
        console.log("Valeur sélectionnée :", val);
        // Ici, tu peux ajouter la logique pour utiliser le chemin sélectionné



        this.close();
      }
    };
  }

  onClose() {
    this.contentEl.empty();
  }
}
