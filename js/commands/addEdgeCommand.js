import { Command } from '../Command.js';

/**
 * @param editor Editor
 * @param edge A Edge
 * @constructor
 */
class AddEdgeCommand extends Command {

    constructor(editor, edge) {

        super(editor);

        this.type = 'AddEdgeCommand';

        this.edge = edge;
        this.edge.id = uuidv4();
        if (edge !== undefined) {

            this.name = `Add Edge: ${edge.source.title} - ${edge.target.title}`;

        }

    }

    execute() {

        // Add Node Code
        this.editor.addEdge(this.edge);
        // this.editor.select( this.node );

    }

    undo() {

        // Remove Node Code
        this.editor.removeEdge(this.edge);
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

export { AddEdgeCommand };
