function FileManager(editor){
    this.loadFile = function ( file, manager ) {

		var filename = file.name;
		var extension = filename.split( '.' ).pop().toLowerCase();

		var reader = new FileReader();
		reader.addEventListener( 'progress', function ( event ) {

			var size = '(' + Math.floor( event.total / 1000 ).format() + ' KB)';
			var progress = Math.floor( ( event.loaded / event.total ) * 100 ) + '%';

			console.log( 'Loading', filename, size, progress );

		} );

		switch ( extension ) {

			case 'js':
			case 'json':

				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					// 2.0

					if ( contents.indexOf( 'postMessage' ) !== - 1 ) {

						var blob = new Blob( [ contents ], { type: 'text/javascript' } );
						var url = URL.createObjectURL( blob );

						var worker = new Worker( url );

						worker.onmessage = function ( event ) {

							event.data.metadata = { version: 2 };
							handleJSON( event.data );

						};

						worker.postMessage( Date.now() );

						return;

					}

					// >= 3.0

					var data;

					try {

						data = JSON.parse( contents );

					} catch ( error ) {

						alert( error );
						return;

					}

					handleJSON( data );

				}, false );
				reader.readAsText( file );

				break;

			case 'zip':

				reader.addEventListener( 'load', function ( event ) {

					handleZIP( event.target.result );

				}, false );
				reader.readAsArrayBuffer( file );

				break;

			default:

				console.error( 'Unsupported file format (' + extension + ').' );

				break;

		}

        function handleJSON( data ) {

            if ( data.metadata === undefined ) { // 2.0
    
                data.metadata = { type: 'App' };
    
            }
    
            if ( data.metadata.type === undefined ) { // 3.0
    
                data.metadata.type = 'App';
    
            }
    
            if ( data.metadata.formatVersion !== undefined ) {
    
                data.metadata.version = data.metadata.formatVersion;
    
            }
    
            switch ( data.metadata.type.toLowerCase() ) {
    
                case 'buffergeometry':
    
                    var loader = new THREE.BufferGeometryLoader();
                    var result = loader.parse( data );
    
                    var mesh = new THREE.Mesh( result );
    
                    editor.execute( new AddObjectCommand( editor, mesh ) );
    
                    break;
    
                case 'geometry':
    
                    console.error( 'Loader: "Geometry" is no longer supported.' );
    
                    break;
    
                case 'object':
    
                    var loader = new THREE.ObjectLoader();
                    loader.setResourcePath( scope.texturePath );
    
                    loader.parse( data, function ( result ) {
    
                        if ( result.isScene ) {
    
                            editor.execute( new SetSceneCommand( editor, result ) );
    
                        } else {
    
                            editor.execute( new AddObjectCommand( editor, result ) );
    
                        }
    
                    } );
    
                    break;
    
                case 'app':
    
                    editor.fromJSON( data );
    
                    break;
    
            }
    
        }
    
        async function handleZIP( contents ) {
    
            var zip = unzipSync( new Uint8Array( contents ) );
    
            // Poly
    
            if ( zip[ 'model.obj' ] && zip[ 'materials.mtl' ] ) {
    
                var { MTLLoader } = await import( '../../examples/jsm/loaders/MTLLoader.js' );
                var { OBJLoader } = await import( '../../examples/jsm/loaders/OBJLoader.js' );
    
                var materials = new MTLLoader().parse( strFromU8( zip[ 'materials.mtl' ] ) );
                var object = new OBJLoader().setMaterials( materials ).parse( strFromU8( zip[ 'model.obj' ] ) );
                editor.execute( new AddObjectCommand( editor, object ) );
    
            }
    
            //
    
            for ( var path in zip ) {
    
                var file = zip[ path ];
    
                var manager = new THREE.LoadingManager();
                manager.setURLModifier( function ( url ) {
    
                    var file = zip[ url ];
    
                    if ( file ) {
    
                        console.log( 'Loading', url );
    
                        var blob = new Blob( [ file.buffer ], { type: 'application/octet-stream' } );
                        return URL.createObjectURL( blob );
    
                    }
    
                    return url;
    
                } );
    
                var extension = path.split( '.' ).pop().toLowerCase();
    
                switch ( extension ) {
    
                    case 'fbx':
    
                        var { FBXLoader } = await import( '../../examples/jsm/loaders/FBXLoader.js' );
    
                        var loader = new FBXLoader( manager );
                        var object = loader.parse( file.buffer );
    
                        editor.execute( new AddObjectCommand( editor, object ) );
    
                        break;
    
                    case 'glb':
    
                        var { DRACOLoader } = await import( '../../examples/jsm/loaders/DRACOLoader.js' );
                        var { GLTFLoader } = await import( '../../examples/jsm/loaders/GLTFLoader.js' );
    
                        var dracoLoader = new DRACOLoader();
                        dracoLoader.setDecoderPath( '../examples/js/libs/draco/gltf/' );
    
                        var loader = new GLTFLoader();
                        loader.setDRACOLoader( dracoLoader );
    
                        loader.parse( file.buffer, '', function ( result ) {
    
                            var scene = result.scene;
    
                            scene.animations.push( ...result.animations );
                            editor.execute( new AddObjectCommand( editor, scene ) );
    
                        } );
    
                        break;
    
                    case 'gltf':
    
                        var { DRACOLoader } = await import( '../../examples/jsm/loaders/DRACOLoader.js' );
                        var { GLTFLoader } = await import( '../../examples/jsm/loaders/GLTFLoader.js' );
    
                        var dracoLoader = new DRACOLoader();
                        dracoLoader.setDecoderPath( '../examples/js/libs/draco/gltf/' );
    
                        var loader = new GLTFLoader( manager );
                        loader.setDRACOLoader( dracoLoader );
                        loader.parse( strFromU8( file ), '', function ( result ) {
    
                            var scene = result.scene;
    
                            scene.animations.push( ...result.animations );
                            editor.execute( new AddObjectCommand( editor, scene ) );
    
                        } );
    
                        break;
    
                }
    
            }
    
        }

	};
}

export {FileManager} ;