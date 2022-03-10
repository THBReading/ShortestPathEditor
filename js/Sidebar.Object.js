

import { UIPanel, UIRow, UIInput, UIButton, UIColor, UICheckbox, UIInteger, UITextArea, UIText, UINumber } from './libs/ui.js';
import { SetValueCommand } from "./commands/setValueCommand.js";
import { MoveNodeCommand } from "./commands/moveNodeCommand.js";

function SidebarObject(editor) {

	var signals = editor.signals;

	var container = new UIPanel();
	container.setBorderTop('0');
	container.setPaddingTop('20px');
	container.setDisplay('none');

	// uuid

	var objectUUIDRow = new UIRow();
	var objectUUID = new UIInput().setWidth('102px').setFontSize('12px').setDisabled(true);
	var objectUUIDRenew = new UIButton("New").setMarginLeft('7px').onClick(function () {

		// objectUUID.setValue( THREE.MathUtils.generateUUID() );

		// editor.execute( new SetUuidCommand( editor, editor.selected, objectUUID.getValue() ) );

	});

	objectUUIDRow.add(new UIText("UUID").setWidth('90px'));
	objectUUIDRow.add(objectUUID);
	objectUUIDRow.add(objectUUIDRenew);

	container.add(objectUUIDRow);

	// title

	var objectTitleRow = new UIRow();
	var objectTitle = new UIInput().setWidth('150px').setFontSize('12px').onChange(function () {
		editor.execute(
			new SetValueCommand(
				editor,
				editor.state.selectedNode,
				"title",
				objectTitle.getValue()
			)
		);
	});

	objectTitleRow.add(new UIText('Title').setWidth('90px'));
	objectTitleRow.add(objectTitle);

	container.add(objectTitleRow);

	// order

	var objectOrderRow = new UIRow();
	var objectOrder = new UIInteger().setWidth('50px').onChange(function () {
		editor.execute(new SetValueCommand(editor, editor.state.selectedNode, "order", objectOrder.getValue()));
	});

	objectOrderRow.add(new UIText('Order').setWidth('90px'));
	objectOrderRow.add(objectOrder);

	container.add(objectOrderRow);

	// position

	var objectPositionRow = new UIRow();
	var objectPositionX = new UIInteger().setWidth('50px').onChange(function () {
		editor.execute(new MoveNodeCommand(editor, editor.state.selectedNode, { x: objectPositionX.getValue() }));
	});
	var objectPositionY = new UIInteger().setWidth('50px').onChange(function () {
		editor.execute(new MoveNodeCommand(editor, editor.state.selectedNode, { y: objectPositionY.getValue() }));
	});

	objectPositionRow.add(new UIText("Position").setWidth('90px'));
	objectPositionRow.add(objectPositionX, objectPositionY);

	container.add(objectPositionRow);


	// user data

	var objectUserDataRow = new UIRow();
	var objectUserData = new UITextArea().setWidth('150px').setHeight('40px').setFontSize('12px').onChange(update);
	objectUserData.onKeyUp(function () {

		try {

			JSON.parse(objectUserData.getValue());

			objectUserData.dom.classList.add('success');
			objectUserData.dom.classList.remove('fail');

		} catch (error) {

			objectUserData.dom.classList.remove('success');
			objectUserData.dom.classList.add('fail');

		}

	});

	objectUserDataRow.add(new UIText("User Data").setWidth('90px'));
	objectUserDataRow.add(objectUserData);

	container.add(objectUserDataRow);

	// var extraInfo = new UIPanel();
	// extraInfo.setBorderTop('0');
	// extraInfo.setPaddingTop('20px');
	// extraInfo.setDisplay('none');

	// container.add(extraInfo)

	//

	function update() { }

	signals.objectSelected.add(function (object) {

		if (object !== null) {

			container.setDisplay('block');

			//updateRows( object );
			updateUI(object);

		} else {

			container.setDisplay('none');

		}

	});

	signals.nodeDataChanged.add(
		function (node) {
			if (!editor.state.selectedNode) { return; }
			if (node.id !== editor.state.selectedNode.id) { return; }
			updateUI(editor.state.selectedNodes);
		}
	)

	function updateRows(object) {

		var properties = {
			'id': objectUUIDRow,
			'order': objectOrderRow,
			'x': objectPositionRow,
			'y': objectPositionRow,
			'title': objectTitleRow,
			'extra': objectUserDataRow,
		};

		if (object === undefined) { return; }

		for (var property in properties) {

			var uiElement = properties[property];

			if (Array.isArray(uiElement) === true) {

				for (var i = 0; i < uiElement.length; i++) {

					uiElement[i].setDisplay(object[property] !== undefined ? '' : 'none');

				}

			} else {

				uiElement.setDisplay(object[property] !== undefined ? '' : 'none');

			}

		}

	}

	// events

	// signals.objectSelected.add( function ( object ) {

	// 	if ( object !== null ) {

	// 		container.setDisplay( 'block' );

	// 		updateRows( object );
	// 		updateUI( object );

	// 	} else {

	// 		container.setDisplay( 'none' );

	// 	}

	// } );

	// signals.objectChanged.add( function ( object ) {

	// 	if ( object !== editor.selected ) return;

	// 	updateUI( object );

	// } );


	function updateUI(object) {

		try {

			if (object.length > 1) {

				let result = {};

				let array = Object.values(object)

				for (let i = 0; i < array.length - 1; i++) {

					for (let prop in array[i]) {
						if (result[prop] !== false) {
							result[prop] = array[i][prop] === array[i + 1][prop];
						}
					}

				}

				object = object[0];
				objectUUID.setValue(result.id ? object.id : null);
				objectTitle.setValue(result.title ? object.title : null);
				objectOrder.setValue(result.order ? object.order : null);
				objectPositionX.setValue(result.x ? object.x : null);
				objectPositionY.setValue(result.y ? object.y : null);
				updateRows(object);

			} else if (object.length === 1) {
				object = object[0];
				objectUUID.setValue(object.id);
				objectTitle.setValue(object.title);
				objectOrder.setValue(object.order);
				objectPositionX.setValue(object.x);
				objectPositionY.setValue(object.y);
				updateRows(object);
			} else {
				updateRows({});
			}
		} catch (err) {
			console.log(err);
			updateRows({});
		}

		//addExtraInfo(object);

	}

	// function addExtraInfo(object) {
	// 	///////////////// TRIAL ////////////////////
	// 	// let container = new UIPanel();
	// 	// container.setBorderTop('0');
	// 	// container.setPaddingTop('20px');
	// 	// container.setDisplay('none');

	// 	let outputArray = [];
	// 	extraInfo.clear();

	// 	Object.keys(object).forEach(function (attr) {
	// 		let trialRow = new UIRow();
	// 		let trailX = new UIInteger().setWidth('50px').onChange(function () {

	// 		});

	// 		trialRow.add(new UIText("Position").setWidth('90px'));
	// 		trialRow.add(trailX);
	// 		extraInfo.add(trialRow);
	// 	});


	// 	// return extraInfo;
	// }


	return container;

}

export { SidebarObject };
