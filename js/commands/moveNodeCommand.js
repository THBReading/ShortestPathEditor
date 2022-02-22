import { Command } from '../Command.js';

/**
 * @param editor Editor
 * @param node A Node
 * @constructor
 */
class MoveNodeCommand extends Command {

    constructor(editor, originalNode, newNodeInfo) {

        super(editor);
        this.type = 'MoveNodeCommand';
        this.name = 'Move Node';
        this.updatable = true;

        this.originalNode = Object.assign({}, originalNode);
        this.newNodeInfo = newNodeInfo;
        this.newNode = Object.assign({}, { ...originalNode }, newNodeInfo);
    }

    execute() {

        // Add Node Code
        this.editor.moveNode(this.originalNode.id, this.newNode);
        // this.editor.select( this.node );
        // console.log("Execute")


    }

    undo() {

        // Remove Node Code
        this.editor.moveNode(this.originalNode.id, this.originalNode);
        //this.editor.deselect();

    }

    update(command) {
        this.newNode.id = command.newNode.id;
        this.newNode = command.newNode;
    }

    // toJSON() {

    // 	const output = super.toJSON( this );

    // 	output.object = this.object.toJSON();

    // 	return output;

    // }

    // fromJSON( json ) {

    // 	super.fromJSON( json );

    // 	this.object = this.editor.objectByUuid( json.object.object.uuid );

    // 	if ( this.object === undefined ) {

    // 		const loader = new ObjectLoader();
    // 		this.object = loader.parse( json.object );

    // 	}

    // }

}

export { MoveNodeCommand };
