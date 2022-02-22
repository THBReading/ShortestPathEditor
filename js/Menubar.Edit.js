import { UIPanel, UIRow, UIHorizontalRule } from './libs/ui.js';

function MenubarEdit( editor ) {

	var container = new UIPanel();
	container.setClass( 'menu' );

	var title = new UIPanel();
	title.setClass( 'title' );
	title.setTextContent( 'Edit' );
	container.add( title );

	var options = new UIPanel();
	options.setClass( 'options' );
	container.add( options );

	// Undo

	var undo = new UIRow();
	undo.setClass( 'option' );
	undo.setTextContent( 'Undo (Ctrl + Z)' );
	undo.onClick( function () {

		editor.undo();

	} );
	options.add( undo );

	// Redo

	var redo = new UIRow();
	redo.setClass( 'option' );
	redo.setTextContent( 'Redo (Ctrl + Y)' );
	redo.onClick( function () {

		editor.redo();

	} );
	options.add( redo );

	// Clear History

	var option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( 'Clear History' );
	option.onClick( function () {

		if ( confirm( 'The Undo/Redo History will be cleared. Are you sure?' ) ) {

			editor.history.clear();

		}

	} );
	options.add( option );


	editor.signals.historyChanged.add( function () {

		var history = editor.history;

		undo.setClass( 'option' );
		redo.setClass( 'option' );

		if ( history.undos.length == 0 ) {

			undo.setClass( 'inactive' );

		}

		if ( history.redos.length == 0 ) {

			redo.setClass( 'inactive' );

		}

	} );

	// ---

	options.add( new UIHorizontalRule() );


	// Clone

	// var option = new UIRow();
	// option.setClass( 'option' );
	// option.setTextContent( strings.getKey( 'menubar/edit/clone' ) );
	// option.onClick( function () {

	// 	var object = editor.selected;

	// 	if ( object === null || object.parent === null ) return; // avoid cloning the camera or scene

	// 	object = object.clone();

	// 	editor.execute( new AddObjectCommand( editor, object ) );

	// } );
	// options.add( option );

	// Delete

	// var option = new UIRow();
	// option.setClass( 'option' );
	// option.setTextContent( strings.getKey( 'menubar/edit/delete' ) );
	// option.onClick( function () {

	// 	var object = editor.selected;

	// 	if ( object !== null && object.parent !== null ) {

	// 		editor.execute( new RemoveObjectCommand( editor, object ) );

	// 	}

	// } );
	// options.add( option );

	//
	return container;

}

export { MenubarEdit };
