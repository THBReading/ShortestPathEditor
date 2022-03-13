import { UIPanel, UIText, UICheckbox, UIInput } from './libs/ui.js';


function MenubarTitle( editor ) {

	var container = new UIPanel();
	container.setClass( 'menu center' );
	// container.setPaddingTop('5px');

	// var titleStatic = new UIText( ' | ' + editor.config.getKey('project/title') + ' | ' );
	// titleStatic.setClass( 'title' );
	// titleStatic.onDblClick( function () {
	// 	console.log('hide and edit')
	// } );

	// container.add( titleStatic );

	var title = new UIInput( editor.config.getKey('project/title') );
	title.setClass( 'project-title' );

	title.onChange(function(){
		editor.config.setKey('project/title',title.getValue())
	})

	container.add( title );

	editor.signals.savingStarted.add( function () {

		title.setTextDecoration( 'underline' );

	} );

	editor.signals.savingFinished.add( function () {

		title.setTextDecoration( 'none' );

	} );

	return container;

}

export { MenubarTitle };
