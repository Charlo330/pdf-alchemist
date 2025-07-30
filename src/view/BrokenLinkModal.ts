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

	async onOpen() {
		this.contentEl.createEl("h2", {
			text: "No linked note found for this PDF",
		});
		const linkedNotePath = await this.controller.getLinkedNotePath(this.pdfLink || "");
		if (this.pdfLink) {
			this.contentEl
				.createEl("p", { text: "The linked note is : " })
				.createSpan({ cls: "link" })
				.setText(linkedNotePath || "No linked note found");
		}

		const div = this.contentEl.createDiv({
			cls: "modal-btn",
		});

		const createFileBtn = div.createEl("button", {
			text: "Create a new note",
			cls: "btn-primary",
		});
		createFileBtn.onclick = async () => {
			const success = await this.controller.createNoteFileIfNotExists();

			if (success) {
				this.close();
			}
		};

		const btn = div.createEl("button", {
			text: "Repair Link",
			cls: "btn-primary",
		});
		btn.onclick = async () => {
			if (this.pdfLink) {
				new FilePickerModal(this.app, this.controller, this.pdfLink).open();
			}
		};
	}
}
