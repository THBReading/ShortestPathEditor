import { UIPanel, UIText, UICheckbox } from './libs/ui.js';


function MenubarTitle( editor ) {

	var strings = editor.strings;

	var container = new UIPanel();
	container.setClass( 'menu center' );

	editor.signals.savingStarted.add( function () {

		// autosave.text.setTextDecoration( 'underline' );

	} );

	editor.signals.savingFinished.add( function () {

		// autosave.text.setTextDecoration( 'none' );

	} );

	var title = new UIText( ' | ' + editor.config.getKey('project/title') + ' | ' );
	title.setClass( 'title' );
	// version.setOpacity( 0.5 );
	container.add( title );

	return container;

}

export { MenubarTitle };
