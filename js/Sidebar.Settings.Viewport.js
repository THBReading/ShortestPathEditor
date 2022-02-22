import { UIPanel, UIText, UIRow, UIInput, UIBreak } from './libs/ui.js';


function SidebarSettingsViewport( editor ) {

	var container = new UIPanel();

	container.add(new UIText('SETTINGS'));


	container.add(new UIBreak(), new UIBreak());

	// title

	var objectTitleRow = new UIRow();
	var objectTitle = new UIInput().setWidth('150px').setFontSize('12px').onChange(function () {
        editor.config.setKey('settings/nodetext',objectTitle.getValue());
        editor.signals.graphDataChanged.dispatch();
		});


	objectTitleRow.add(new UIText('Title').setWidth('90px'));
	objectTitleRow.add(objectTitle);

	container.add(objectTitleRow);

    // objectTitle.setValue()
    // TODO: objectTitle.setValue(editor.config.getKey('settings/nodetext'))

	return container;

}

export { SidebarSettingsViewport };
