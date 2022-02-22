import { UIPanel, UIRow, UISelect, UISpan, UIText } from './libs/ui.js';

import { SidebarSettingsViewport } from './Sidebar.Settings.Viewport.js';
// import { SidebarSettingsShortcuts } from './Sidebar.Settings.Shortcuts.js';
import { SidebarSettingsHistory } from './Sidebar.Settings.History.js';
import { SidebarSettingsSnapping } from './Sidebar.Settings.Snapping.js';

function SidebarSettings( editor ) {

	// var config = editor.config;
	// var strings = editor.strings;

	var container = new UISpan();

	var snapping = new UIPanel();
	snapping.setBorderTop( '0' );
	snapping.setPaddingTop( '20px' );
	container.add( snapping );

	container.add( new SidebarSettingsSnapping( editor ) );

	var settings = new UIPanel();
	settings.setBorderTop( '0' );
	settings.setPaddingTop( '20px' );
	container.add( settings );

	container.add( new SidebarSettingsViewport( editor ) );

	var history = new UIPanel();
	history.setBorderTop( '0' );
	history.setPaddingTop( '20px' );
	container.add( history );

	container.add( new SidebarSettingsHistory( editor ) );

	return container;

}

export { SidebarSettings };
