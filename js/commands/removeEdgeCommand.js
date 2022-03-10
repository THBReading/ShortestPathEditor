import { Command } from '../Command.js';

/**
 * @param editor Editor
 * @param edge An Edge
 * @constructor
 */
class RemoveEdgeCommand extends Command {

    constructor(editor, edge) {

        super(editor);

        this.type = 'RemoveEdgeCommand';

        this.edge = edge;
        if (edge !== undefined) {
            this.name = `Remove Edge: ${undefined}`;
        }

    }

    execute() {
        // Remove Node Code
        this.editor.removeEdge(this.edge);
        //this.editor.deselect();
    }

    undo() {
        // Add Node Code
        this.editor.addEdge(this.edge);
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

export { RemoveEdgeCommand };
