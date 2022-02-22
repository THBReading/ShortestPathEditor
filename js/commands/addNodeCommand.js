import { Command } from '../Command.js';

/**
 * @param editor Editor
 * @param node A Node
 * @constructor
 */
class AddNodeCommand extends Command {

    constructor(editor, node) {

        super(editor);

        this.type = 'AddNodeCommand';

        this.node = node;
        this.node.id = uuidv4();
        if (node !== undefined) {

            this.name = `Add Node`;

        }

    }

    execute() {

        // Add Node Code
        this.editor.addNode(this.node);
        // this.editor.select( this.node );

    }

    undo() {

        // Remove Node Code
        this.editor.removeNode(this.node);
        //this.editor.deselect();

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

export { AddNodeCommand };
