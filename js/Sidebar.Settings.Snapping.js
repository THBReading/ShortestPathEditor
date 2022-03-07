import { UIPanel, UIRow, UIButton, UIInteger, UIText, UIBreak, UICheckbox } from './libs/ui.js';


function SidebarSettingsSnapping(editor) {

	var signals = editor.signals;

	var container = new UIPanel();

	var titleRow = new UIRow();
	

	var persistent = new UICheckbox(editor.state.grid.active);
	persistent.setPosition('absolute').setRight("8px");
	persistent.onChange(function () { 
		editor.state.grid.active = this.getValue();
	});

	titleRow.add(new UIText('SNAPPING GRID'),persistent);
	container.add(titleRow);
	container.add(new UIBreak(), new UIBreak());

	container.setBorderTop('0');
	container.setPaddingTop('20px');

	// position

	var centrePositionRow = new UIRow();
	var centrePositionX = new UIInteger().setWidth('40px').onChange(function () {
		editor.state.grid.centre.x = centrePositionX.getValue();
		editor.signals.snapGridChanged.dispatch();
	});
	var centrePositionY = new UIInteger().setWidth('40px').onChange(function () {
		editor.state.grid.centre.y = centrePositionY.getValue();
		editor.signals.snapGridChanged.dispatch();
	});
	var centreOn = new UIButton("New").setMarginLeft('7px').onClick(function () {

	});

	centrePositionRow.add(new UIText("Centre").setWidth('120px'));
	centrePositionRow.add(centrePositionX, centrePositionY);
	centrePositionRow.add(centreOn);

	container.add(centrePositionRow);

	// position

	var dimensionsRow = new UIRow();
	var dimensionsWidth = new UIInteger().setWidth('40px').onChange(function () {
		editor.state.grid.dimensions.x = dimensionsWidth.getValue();
		editor.signals.snapGridChanged.dispatch();
	});
	var dimensionsHeight = new UIInteger().setWidth('40px').onChange(function () {
		editor.state.grid.dimensions.y = dimensionsHeight.getValue();
		editor.signals.snapGridChanged.dispatch();
	});


	dimensionsRow.add(new UIText("Width/Height").setWidth('120px'));
	dimensionsRow.add(dimensionsWidth, dimensionsHeight);


	container.add(dimensionsRow);

	signals.snapGridChanged.add(updateUI);

	updateUI();

	function updateUI() {
		centrePositionX.setValue(editor.state.grid.centre.x);
		centrePositionY.setValue(editor.state.grid.centre.y);
		dimensionsWidth.setValue(editor.state.grid.dimensions.x);
		dimensionsHeight.setValue(editor.state.grid.dimensions.y);
		// objectTitle.setValue(object.title);
		// objectOrder.setValue(object.order);
		// objectPositionX.setValue(object.x);
		// objectPositionY.setValue(object.y);
	}

	return container;

}

export { SidebarSettingsSnapping };
