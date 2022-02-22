// import { Command } from '../Command.js';

// /**
//  * @param editor Editor
//  * @param node A Node
//  * @constructor
//  */
// class SetValueCommand extends Command {

//     constructor(editor, originalNode, newNodeInfo) {

//         super(editor);

//         this.type = 'SetValueCommand';
//         this.updatable = true;
//         this.newNodeInfo = newNodeInfo;
//         // this.newNode = Object.assign({}, originalNode, newNodeInfo);
//         this.originalNode = originalNode;
//         if (newNodeInfo !== undefined) {

//             this.name = `Set Node Value: ${newNodeInfo}`;

//         }

//     }

//     execute() {

//         // Add Node Code
//         this.editor.setValue(this.originalNode.id, this.newNodeInfo);
//         // this.editor.select( this.node );

//     }

//     undo() {

//         // Remove Node Code
//         this.editor.setValue(this.originalNode.id, this.originalNode);
//         //this.editor.deselect();

//     }
//     update(command) {
//         // this.originalNode.id = command.originalNode.id;
//         // this.originalNode = command.originalNode;
//         this.originalNode.id = command.originalNode.id;
//         // this.originalNode = command.originalNode;
//         this.newNodeInfo = command.newNodeInfo;
//     }


//     // toJSON() {

//     // 	const output = super.toJSON( this );

//     // 	output.object = this.object.toJSON();

//     // 	return output;

//     // }

//     // fromJSON( json ) {

//     // 	super.fromJSON( json );

//     // 	this.object = this.editor.objectByUuid( json.object.object.uuid );

//     // 	if ( this.object === undefined ) {

//     // 		const loader = new ObjectLoader();
//     // 		this.object = loader.parse( json.object );

//     // 	}

//     // }

// }

// export { SetValueCommand };




import { Command } from '../Command.js';

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @param attributeName string
 * @param newValue number, string, boolean or object
 * @constructor
 */
class SetValueCommand extends Command {

	constructor( editor, object, attributeName, newValue ) {

		super( editor );

		this.type = 'SetValueCommand';
		this.name = `Set ${attributeName}`;
		this.updatable = true;

		this.object = object;
		this.attributeName = attributeName;
		this.oldValue = ( object !== undefined ) ? object[ attributeName ] : undefined;
		this.newValue = newValue;

	}

	execute() {

		this.object[ this.attributeName ] = this.newValue;
        this.editor.setValue(this.object.id, this.object);
		// this.editor.signals.objectChanged.dispatch( this.object );
		// this.editor.signals.sceneGraphChanged.dispatch();

	}

	undo() {

        this.object[ this.attributeName ] = this.oldValue;
        this.editor.setValue(this.object.id, this.object);

		// this.object[ this.attributeName ] = this.oldValue;
		// this.editor.signals.objectChanged.dispatch( this.object );
		// this.editor.signals.sceneGraphChanged.dispatch();

	}

	update( cmd ) {

		this.newValue = cmd.newValue;

	}

	toJSON() {

		const output = super.toJSON( this );

		output.objectUuid = this.object.uuid;
		output.attributeName = this.attributeName;
		output.oldValue = this.oldValue;
		output.newValue = this.newValue;

		return output;

	}

	fromJSON( json ) {

		super.fromJSON( json );

		this.attributeName = json.attributeName;
		this.oldValue = json.oldValue;
		this.newValue = json.newValue;
		this.object = this.editor.objectByUuid( json.objectUuid );

	}

}

export { SetValueCommand };
