import { App, Modal } from "obsidian";
import { FilePickerModal } from "./FilePickerModal";
import { PdfNotesController } from "src/controller/PdfNotesController";

export class BrokenLinkModal extends Modal {
	private pdfLink: string | null = null;
	private controller: PdfNotesController;

	constructor(
		app: App,
		controller: PdfNotesController,
		pdfLink: string | null
	) {
		super(app);
		this.controller = controller;
		this.pdfLink = pdfLink;
	}

	onOpen() {
		this.contentEl.createEl("h2", {
			text: "The linked file to this pdf is broken !",
		});

		if (this.pdfLink) {
			this.contentEl
				.createEl("p", { text: "The linked note is : " })
				.createSpan({ cls: "link" })
				.setText(this.pdfLink);
		}

		const btn = this.contentEl.createEl("button", {
			text: "Repair Link",
		});
		btn.onclick = async () => {
			if (this.pdfLink) {
				new FilePickerModal(this.app, this.controller, this.pdfLink).open();
			}
		};
	}
}
