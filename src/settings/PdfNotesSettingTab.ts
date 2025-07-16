import { PluginSettingTab, Setting } from "obsidian";

export class PdfNotesSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: PDFNotesPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'PDF Notes Settings' });

    new Setting(containerEl)
      .setName('Notes folder location')
      .setDesc('Where to create new note files')
      .addText(text => text
        .setPlaceholder('Example: Notes/PDF')
        .setValue(this.plugin.settings.folderLocation)
        .onChange(async (value) => {
          this.plugin.settings.folderLocation = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Note template')
      .setDesc('Template for new note files')
      .addTextArea(text => text
        .setPlaceholder('# {{title}}\n\n')
        .setValue(this.plugin.settings.noteTemplate)
        .onChange(async (value) => {
          this.plugin.settings.noteTemplate = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Auto-create notes')
      .setDesc('Automatically create note files for new PDFs')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoCreateNotes)
        .onChange(async (value) => {
          this.plugin.settings.autoCreateNotes = value;
          await this.plugin.saveSettings();
        }));
  }
}
