import { App, PluginSettingTab, Setting } from "obsidian";
import PDFNotesPlugin from "src/main";
import { FileTypeEnum, FolderSuggest } from "src/view/FolderSuggest";

export class PdfNotesSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: PDFNotesPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "PDF Notes Settings" });

		new Setting(containerEl)
			.setName("Auto-create notes")
			.setDesc("Automatically create note files for new PDFs")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoCreateNotes)
					.onChange(async (value) => {
						this.plugin.settings.autoCreateNotes = value;
						this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Page Mode")
			.setDesc("Enable page changing for linked notes")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.isPageMode)
					.onChange(async (value) => {
						this.plugin.settings.isPageMode = value;
						this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Notes folder location")
			.setDesc("Where to create new note files")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("root", "Root folder")
					.addOption("folder", "Specific folder")
					.addOption("relativeFolder", "Relative to PDF folder")
					.addOption("sameFolder", "Same folder as PDF")
					.setValue(this.plugin.settings.folderLocation)
					.onChange(async (value) => {
						this.plugin.settings.folderLocation = value;

						if (div.firstChild) {
							div.removeChild(div.firstChild);
						}
						this.showSettingsByValue(div, value);
					})
			);

		const div = containerEl.createDiv();
		this.showSettingsByValue(div, this.plugin.settings.folderLocation);
	}

	showSettingsByValue(div: HTMLElement, value: string) {
		console.log("div", value);
		switch (value) {
			case "root":
				this.plugin.settings.folderLocationPath = "root";
				this.plugin.saveSettings();
				break;
			case "folder":
				// Show folder-specific settings
				new Setting(div)
					.setName("Folder path")
					.setDesc("Path to the folder where notes will be created")
					.addText((text) => {
						text.onChange(async (value) => {
							this.plugin.settings.folderLocationPath = value;
							this.plugin.saveSettings();
						});
						text.setPlaceholder("Enter folder path");
						text.setValue(
							this.plugin.settings.folderLocationPath || ""
						);
						return new FolderSuggest(
							this.app,
							text.inputEl,
							FileTypeEnum.FOLDER
						).setValue(
							this.plugin.settings.folderLocationPath ?? ""
						);
					});
				break;
			case "sameFolder":
				// Show same-folder-specific settings
				this.plugin.settings.folderLocationPath = null;
				this.plugin.saveSettings();
				break;
			case "relativeFolder":
				// show the folder path relative to the PDF file
				new Setting(div)
					.setName("Relative to PDF folder path")
					.setDesc(
						createFragment((frag) => {
							frag.append(
								"Path to the folder where notes will be created (relative to the PDF file)"
							);
							frag.appendChild(document.createElement("br"));
							frag.appendChild(document.createElement("br"));
							frag.append("Example:");
							frag.appendChild(document.createElement("br"));
							frag.appendChild(document.createTextNode("- `./notes` will create notes in the same folder as the PDF file"));
							frag.appendChild(document.createElement("br"));
							frag.append("- `../notes` will create notes in the parent folder of the PDF file");
						})
					)
					.addText((text) =>
						text
							.setPlaceholder("")
							.setValue(
								this.plugin.settings.folderLocationPath || ""
							)
							.onChange(async (value) => {
								this.plugin.settings.folderLocationPath = value;
								this.plugin.saveSettings();
							})
					);
				break;
			default:
				// Hide all folder-specific settings
				if (div.firstChild) {
					div.removeChild(div.firstChild);
				}
				break;
		}
	}
}
