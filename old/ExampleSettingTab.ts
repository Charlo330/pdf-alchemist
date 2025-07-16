import ExamplePlugin from './main';
import { App, PluginSettingTab, Setting } from 'obsidian';
import { FolderSuggest } from './FolderSuggest';

export class ExampleSettingTab extends PluginSettingTab {
  plugin: ExamplePlugin;

  constructor(app: App, plugin: ExamplePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
    .setName('Folder location')
    .setDesc('Choose a folder.')
    .addSearch(search => {
        search
            .setPlaceholder('Example: folder1/folder2')
            .setValue(this.plugin.settings.folderLocation)
            .onChange(async (value) => {
                this.plugin.settings.folderLocation = value;
                await this.plugin.saveSettings();
            });

        // Add folder suggestions
        new FolderSuggest(this.app, search.inputEl);
    });
  }
}
