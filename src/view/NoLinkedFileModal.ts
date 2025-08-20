import { App, Modal, setIcon } from "obsidian";
import { BrokenLinkModalController } from "src/controller/BrokenLinkModalController";

export class NoLinkedFileModal extends Modal {
	private pdfLink: string | null = null;
	private brokenLinkModalController: BrokenLinkModalController;
	private isPageMode: boolean;

	constructor(
		app: App,
		brokenLinkModalController: BrokenLinkModalController,
		pdfLink: string | null
	) {
		super(app);
		this.brokenLinkModalController = brokenLinkModalController;
		this.pdfLink = pdfLink;
	}

	async onOpen() {
		this.contentEl.createEl("h2", {
			text: "No linked note found for this PDF",
		});
		const linkedNotePath =
			await this.brokenLinkModalController.getLinkedNotePath(
				this.pdfLink || ""
			);
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

		const modeDiv = divCreate.createEl("div");

		const modeButton = modeDiv.createEl("button", {
			cls: "page-mode-toggle mod-cta",
		});

		this.isPageMode = this.brokenLinkModalController.isPageModeEnabled();
		setIcon(modeButton, this.isPageMode ? "file-stack" : "file");

		modeButton.onclick = () => {
			this.isPageMode = !this.isPageMode;
			setIcon(modeButton, this.isPageMode ? "file-stack" : "file");
		};

		const createFileBtn = divCreate.createEl("button", {
			text: "Create a new note",
			cls: "btn-primary",
		});
		createFileBtn.onclick = async () => {
			const isPageMode = this.isPageMode;
			const success =
				await this.brokenLinkModalController.createNoteFileByCurrentPdfOpened(
					isPageMode
				);

			if (success) {
				this.close();
			}
		};

		const btn = div.createEl("button", {
			text: "Link to existing note",
			cls: "btn-primary",
		});
		btn.onclick = async () => {
			if (this.pdfLink) {
				this.brokenLinkModalController.createFilePickerModalView(
					this.pdfLink
				);
				this.close();
			}
		};
	}
}
