
import { UIPanel, UIBreak, UIText, UIListbox } from './libs/ui.js';
// import { UIBoolean, UIOutliner } from './libs/ui.three.js';

function SidebarSettingsHistory(editor) {

	// var strings = editor.strings;

	var signals = editor.signals;

	// var config = editor.config;

	var history = editor.history;

	var container = new UIPanel();

	container.add(new UIText('HISTORY'));


	container.add(new UIBreak(), new UIBreak());

	var history = new UIListbox().onClick(function () {
		editor.history.goToState(parseInt(history.getValue()));
	});

	container.add(history);


	function refreshHistoryBrowserUI() {
		let items = [];

		for (var i = 0, l = editor.history.undos.length; i < l; i++) {

			items.push(editor.history.undos[i]);

		}

		for (var i = editor.history.redos.length - 1; i >= 0; i--) {

			items.push(editor.history.redos[i]);

		}

		history.setItems(items);

	}

	editor.signals.historyChanged.add(refreshHistoryBrowserUI);

	editor.signals.historyChanged.add(function (cmd) {

		history.selectIndex(cmd !== undefined ? editor.history.undos.length - 1 : null);

	});

	return container;



}

export { SidebarSettingsHistory };
