import { UIPanel, UIText, UIRow, UIInput, UIBreak, UISelect } from './libs/ui.js';


function SidebarSettingsViewport(editor) {

	var container = new UIPanel();

	container.add(new UIText('GRAPH SETTINGS'));


	container.add(new UIBreak(), new UIBreak());

	// TODO: Set to be dynamic on graph info load to display more information if avaliable
		var nodeTitleOptions = ["", "id", "title", "order", "x", "y"];
		var nodeTitleRow = new UIRow();
		var nodeTitle = new UISelect().setWidth('150px').setFontSize('12px')
			.setOptions(nodeTitleOptions)
			.onChange(function () {
				editor.config.setKey('settings/nodetext', nodeTitleOptions[nodeTitle.getValue()]);
				console.log(editor.config.getKey('settings/nodetext'))
				editor.signals.graphDataChanged.dispatch();
			})
			.setValue(nodeTitleOptions.indexOf(editor.config.getKey('settings/nodetext')));;
	
	
		nodeTitleRow.add(new UIText('Node Text').setWidth('90px'));
		nodeTitleRow.add(nodeTitle);
	
		container.add(nodeTitleRow);

	// TODO: Set to be dynamic on graph info load to display more information if avaliable
	var edgeTitleOptions = ["", "weight"];
	var edgeTitleRow = new UIRow();
	var edgeTitle = new UISelect().setWidth('150px').setFontSize('12px')
		.setOptions(edgeTitleOptions)
		.onChange(function () {
			editor.config.setKey('settings/edgetext', edgeTitleOptions[edgeTitle.getValue()]);
			console.log(editor.config.getKey('settings/nodetext'))
			editor.signals.graphDataChanged.dispatch();
		})
		.setValue(edgeTitleOptions.indexOf(editor.config.getKey('settings/edgetext')));


	edgeTitleRow.add(new UIText('Edge Text').setWidth('90px'));
	edgeTitleRow.add(edgeTitle);

	container.add(edgeTitleRow);



	// objectTitle.setValue()
	// TODO: objectTitle.setValue(editor.config.getKey('settings/nodetext'))

	return container;

}

export { SidebarSettingsViewport };
