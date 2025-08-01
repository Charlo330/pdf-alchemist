import { App, Modal } from "obsidian";
import { BrokenLinkModalController } from "src/controller/BrokenLinkModalController";

export class BrokenLinkModal extends Modal {
	private pdfLink: string | null = null;
	private brokenLinkModalController: BrokenLinkModalController;
	private toggle: HTMLInputElement;

	constructor(
		app: App,
		brokenLinkModalController: BrokenLinkModalController,
		pdfLink: string | null,
	) {
		super(app);
		this.brokenLinkModalController = brokenLinkModalController;
		this.pdfLink = pdfLink;
	}

	async onOpen() {
		this.contentEl.createEl("h2", {
			text: "No linked note found for this PDF",
		});
		const linkedNotePath = await this.brokenLinkModalController.getLinkedNotePath(this.pdfLink || "");
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
		this.toggle = divCreate.createEl("input", {
			text: "Page mode",
			type: "checkbox",
			cls: "file-picker-restore-selection",
		});

		this.toggle.checked = this.brokenLinkModalController.isPageModeEnabled();

		const createFileBtn = divCreate.createEl("button", {
			text: "Create a new note",
			cls: "btn-primary",
		});
		createFileBtn.onclick = async () => {
			const isPageMode = this.toggle.checked;
			console.log("isPageMode", isPageMode);
			const success = await this.brokenLinkModalController.createNoteFileByCurrentPdfOpened(isPageMode);

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
				this.brokenLinkModalController.createFilePickerModalView(this.pdfLink)
			}
		};
	}
}
