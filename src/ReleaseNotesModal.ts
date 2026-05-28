import {App, Component, MarkdownRenderer, Modal} from 'obsidian';

// Import the release notes markdown as a raw string (esbuild text loader)
import releaseNotes from './release-notes.md';

export class ReleaseNotesModal extends Modal {
	private version: string;
	private component: Component;

	constructor(app: App, version: string) {
		super(app);
		this.version = version;
		this.component = new Component();
	}

	async onOpen() {
		const {contentEl} = this;
		this.component.load();

		contentEl.addClass('vibgyor-release-notes-modal');

		// Render the markdown content using Obsidian's built-in renderer
		const markdownContainer = contentEl.createDiv({cls: 'vibgyor-release-notes-content'});
		await MarkdownRenderer.render(
			this.app,
			releaseNotes,
			markdownContainer,
			'',
			this.component
		);

		// "Got it" button at the bottom
		const buttonContainer = contentEl.createDiv({cls: 'vibgyor-release-notes-footer'});
		const gotItBtn = buttonContainer.createEl('button', {
			text: 'Got it!',
			cls: 'mod-cta'
		});
		gotItBtn.addEventListener('click', () => this.close());
	}

	onClose() {
		this.component.unload();
		this.contentEl.empty();
	}
}
