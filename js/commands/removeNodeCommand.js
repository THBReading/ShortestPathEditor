import { Command } from '../Command.js';

/**
 * @param editor Editor
 * @param node A Node
 * @constructor
 */
class RemoveNodeCommand extends Command {

    constructor(editor, node) {

        super(editor);

        this.type = 'RemoveNodeCommand';

        this.node = node;
        if (node !== undefined) {
            this.name = `Remove Node: ${node.title}`;
        }

    }

    execute() {
        // Remove Node Code
        this.editor.removeNode(this.node);
        //this.editor.deselect();
    }

    undo() {
        // Add Node Code
        this.editor.addNode(this.node);
        // this.editor.select( this.node );
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

export { RemoveNodeCommand };
