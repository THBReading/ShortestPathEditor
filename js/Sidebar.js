import { UITabbedPanel, UISpan } from './libs/ui.js';

import { SidebarSettings } from './Sidebar.Settings.js';
import { SidebarProperties } from './Sidebar.Properties.js';

function Sidebar( editor ) {

	var container = new UITabbedPanel();
	container.setId( 'sidebar' );

	var info = new UISpan().add(
		// new SidebarScene( editor ),
		new SidebarProperties( editor ),
		// new SidebarAnimation( editor ),
		// new SidebarScript( editor )
	);
	// var project = new SidebarProject( editor );
	var settings = new SidebarSettings( editor );

	container.addTab( 'info', 'Info' , info );
	// container.addTab( 'project', 'Project' , project );
	container.addTab( 'settings', 'Settings' , settings );
	container.select( 'info' );

	return container;

}

export { Sidebar };
