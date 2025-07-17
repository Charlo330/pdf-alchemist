import { Modal, App } from 'obsidian';

export class FileLinkedModal extends Modal {
	private link: string | null = null;

	constructor(app: App, link:string | null) {
		super(app);
		this.link = link;
	}

	onOpen() {
		this.contentEl.createEl('h2', { text: 'Linked file' });
		
		if (this.link) {
			this.contentEl.createEl('p', { text: `filepath linked to this note : ` }).createSpan({ cls: 'link' }).setText(this.link);

		} else {
			this.contentEl.createEl('p', { text: 'No linked file found.' });
		}
	}
}
