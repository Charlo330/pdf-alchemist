import { Modal, App } from 'obsidian';

export class TimedModal extends Modal {
	private link: string | null = null;
	private secondsLeft = 10;

	constructor(app: App, link:string | null) {
		super(app);
		this.link = link;
	}

	onOpen() {
		this.contentEl.createDiv({ cls: 'timed-modal' });
		this.contentEl.createEl('h2', { text: 'Linked file' });
		const timerEl = this.contentEl.createEl('span', { text: `${this.secondsLeft} seconds` });
		timerEl.addClass('timer');
		
		if (this.link) {
			this.contentEl.createEl('p', { text: `filepath linked to this note : ` }).createSpan({ cls: 'link' }).setText(this.link);

		} else {
			this.contentEl.createEl('p', { text: 'No linked file found.' });
		}

		setTimeout(() => {
			this.close();
		}, 10000);

		this.startCountdown(timerEl);
	}

	startCountdown(timerEl: HTMLElement) {
	this.secondsLeft = 10;

	const tick = () => {
		if (this.secondsLeft <= 0) {
			timerEl.setText("Terminé !");
			return;
		}

		timerEl.setText(`${this.secondsLeft} seconds`);
		this.secondsLeft--;

		setTimeout(tick, 1000); // rappel dans 1s
	};

	tick(); // démarrer le premier tick
}

	onClose() {
		this.contentEl.empty();
	}
}
