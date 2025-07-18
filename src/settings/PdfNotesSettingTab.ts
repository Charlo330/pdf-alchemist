import { App, PluginSettingTab, Setting } from "obsidian";
import PDFNotesPlugin from "src/main";

export class PdfNotesSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: PDFNotesPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "PDF Notes Settings" });

		new Setting(containerEl)
			.setName("Note template")
			.setDesc("Template for new note files")
			.addTextArea((text) =>
				text
					.setPlaceholder("# {{title}}\n\n")
					.setValue(this.plugin.settings.noteTemplate)
					.onChange(async (value) => {
						this.plugin.settings.noteTemplate = value;
						this.plugin.saveSettings();
					})
			);

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
			.setName("Notes folder location")
			.setDesc("Where to create new note files")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("root", "Root folder")
					.addOption("folder", "Specific folder")
					.addOption("sameFolder", "Same folder as PDF")
					.addOption("parentFolder", "Parent folder of PDF")
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
	}

	showSettingsByValue(div : HTMLElement, value: string) {
		console.log("div", value)
			switch (value) {
				case "root":
					this.plugin.settings.folderLocationPath = null;
					this.plugin.saveSettings();
					break;
				case "folder":
					// Show folder-specific settings
					new Setting(div)
						.setName("Folder path")
						.setDesc("Path to the folder where notes will be created")
						.addText((text) =>
							text
								.setPlaceholder("Enter folder path")
								.setValue(this.plugin.settings.folderLocation)
								.onChange(async (value) => {
									this.plugin.saveSettings();
								})
						);
					break;
				case "sameFolder":
					// Show same-folder-specific settings
					this.plugin.settings.folderLocationPath = null;
					this.plugin.saveSettings();
					break;
				case "parentFolder":
					// Show parent-folder-specific settings
					new Setting(div)
						.setName("Parent folder path")
						.setDesc("Path to the parent folder where notes will be created")
						.addText((text) =>
							text
								.setPlaceholder("Enter parent folder path")
								.setValue(this.plugin.settings.folderLocation)
								.onChange(async (value) => {
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
