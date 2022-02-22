import { UIPanel, UIButton, UICheckbox, UIText } from './libs/ui.js';

function Toolbar(editor) {

	var signals = editor.signals;

	var container = new UIPanel();
	container.setId('toolbar');

	// viewer / creator / editor

	var viewerIcon = document.createElement('img');
	viewerIcon.title = 'viewer';
	viewerIcon.src = 'icons/viewer.svg';

	var viewer = new UIButton();
	viewer.dom.className = 'Button selected';
	viewer.dom.appendChild(viewerIcon);
	viewer.onClick(function () { signals.transformModeChanged.dispatch('viewer'); });
	container.add(viewer);

	var creatorIcon = document.createElement('img');
	creatorIcon.title = 'creator';
	creatorIcon.src = 'icons/creator.svg';

	var creator = new UIButton();
	creator.dom.appendChild(creatorIcon);
	creator.onClick(function () { signals.transformModeChanged.dispatch('creator'); });
	container.add(creator);

	var editorIcon = document.createElement('img');
	editorIcon.title = 'editor';
	editorIcon.src = 'icons/editor.svg';

	var editor = new UIButton();
	editor.dom.appendChild(editorIcon);
	editor.onClick(function () { signals.transformModeChanged.dispatch('editor'); });
	container.add(editor);

	var local = new UICheckbox(false);
	local.dom.title = 'toolbar/local';
	local.onChange(function () { });
	container.add(local);

	//
	signals.transformModeChanged.add(function (mode) {

		viewer.dom.classList.remove('selected');
		creator.dom.classList.remove('selected');
		editor.dom.classList.remove('selected');

		switch (mode) {

			case 'viewer': viewer.dom.classList.add('selected'); break;
			case 'creator': creator.dom.classList.add('selected'); break;
			case 'editor': editor.dom.classList.add('selected'); break;

		}

	
	});



	return container;

}

Toolbar.prototype = {}

export { Toolbar };
