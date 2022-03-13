import { Command } from '../Command.js';

/**
 * @param editor Editor
 * @param cmdArray array containing command objects
 * @constructor
 */
class MultiCmdsCommand extends Command {

	constructor(editor, cmdArray, name = 'Multiple Changes') {

		super(editor);

		this.type = 'MultiCmdsCommand';
		this.name = name;

		this.cmdArray = (cmdArray !== undefined) ? cmdArray : [];

	}

	execute() {

		this.editor.signals.graphDataChanged.active = false;

		for (let i = 0; i < this.cmdArray.length; i++) {

			this.cmdArray[i].execute();

		}

		this.editor.signals.graphDataChanged.active = true;
		this.editor.signals.graphDataChanged.dispatch();

	}

	undo() {

		this.editor.signals.graphDataChanged.active = false;

		for (let i = this.cmdArray.length - 1; i >= 0; i--) {

			this.cmdArray[i].undo();

		}

		this.editor.signals.graphDataChanged.active = true;
		this.editor.signals.graphDataChanged.dispatch();

	}

	toJSON() {

		const output = super.toJSON(this);

		const cmds = [];
		for (let i = 0; i < this.cmdArray.length; i++) {

			cmds.push(this.cmdArray[i].toJSON());

		}

		output.cmds = cmds;

		return output;

	}

	fromJSON(json) {

		super.fromJSON(json);

		const cmds = json.cmds;
		for (let i = 0; i < cmds.length; i++) {

			const cmd = new window[cmds[i].type]();	// creates a new object of type "json.type"
			cmd.fromJSON(cmds[i]);
			this.cmdArray.push(cmd);

		}

	}

}

export { MultiCmdsCommand };
