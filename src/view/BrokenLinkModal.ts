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

		const divCreate = div.createDiv({
			cls: "modal-btn-create",
		});
		// create toggle
		divCreate.createEl("label", {
			text: "Page Mode",
			cls: "file-picker-restore-selection-label",
		});
		const toggle = divCreate.createEl("input", {
			text: "Page mode",
			type: "checkbox",
			cls: "file-picker-restore-selection",
		});

		toggle.checked = this.controller.getSettings().isPageMode;

		const createFileBtn = divCreate.createEl("button", {
			text: "Create a new note",
			cls: "btn-primary",
		});
		createFileBtn.onclick = async () => {
			const isPageMode = toggle.checked;
			const success = await this.controller.createNoteFileByCurrentPdfOpened(isPageMode);

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
