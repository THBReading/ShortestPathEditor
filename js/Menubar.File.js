import { UIPanel, UIRow, UIHorizontalRule } from './libs/ui.js';

function MenubarFile(editor) {

	var container = new UIPanel();
	container.setClass('menu');

	var title = new UIPanel();
	title.setClass('title');
	title.setTextContent('File');
	container.add(title);

	var options = new UIPanel();
	options.setClass('options');
	container.add(options);

	// New

	var option = new UIRow();
	option.setClass('option');
	option.setTextContent('New');
	option.onClick(function () {

		if (confirm('Any unsaved data will be lost. Are you sure?')) {

			editor.clear();

		}

	});
	options.add(option);

	//

	options.add(new UIHorizontalRule());

	// Import

	var form = document.createElement('form');
	form.style.display = 'none';
	document.body.appendChild(form);

	var fileImport = document.createElement('input');
	fileImport.multiple = true;
	fileImport.type = 'file';
	fileImport.addEventListener('change', function () {
		// const selectedFiles = [...fileImport.files];
		// console.log(selectedFiles.files);
		// editor.fromJSON(selectedFile)
		editor.loader.loadFile( fileImport.files[0] );
		form.reset();

	});
	form.appendChild(fileImport);

	var fileExport = document.createElement('a');
	fileExport.addEventListener('click', function () {

		var output = editor.toJSON();

		try {

			output = JSON.stringify( output, null, '\t' );
			output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );

		} catch ( e ) {

			output = JSON.stringify( output );

		}

		saveString( output, 'gte-download.json' );
		form.reset();

	});
	form.appendChild(fileExport);

	var option = new UIRow();
	option.setClass('option');
	option.setTextContent('Import');
	option.onClick(function () { fileImport.click(); });
	options.add(option);

	var option = new UIRow();
	option.setClass('option');
	option.setTextContent('Export');
	option.onClick(function () { fileExport.click(); });
	options.add(option);

	//

	options.add(new UIHorizontalRule());

	var link = document.createElement( 'a' );
	function save( blob, filename ) {

		if ( link.href ) {

			URL.revokeObjectURL( link.href );

		}

		link.href = URL.createObjectURL( blob );
		link.download = filename || 'data.json';
		link.dispatchEvent( new MouseEvent( 'click' ) );

	}

	function saveString( text, filename ) {

		save( new Blob( [ text ], { type: 'text/plain' } ), filename );

	}

	return container;

}

export { MenubarFile };
