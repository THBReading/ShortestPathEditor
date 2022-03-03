import { History as _History } from './History.js';
import { Storage as _Storage } from './Storage.js';
import { Graph } from './Graph.js'
import { Config } from './Config.js';
import { FileManager } from './FileManager.js';

function Editor() {
	var Signal = signals.Signal;
	var graph = new Graph();
	// graph.example()

	this.signals = {
		transformModeChanged: new Signal(),
		graphDataChanged: new Signal(),
		historyChanged: new Signal(),
		objectSelected: new Signal(),
		nodeDataChanged: new Signal(),
		snapGridChanged: new Signal(),
		windowResize: new Signal(),
		savingStarted: new Signal(),
		savingFinished: new Signal(),
	}

	this.config = new Config();
	this.loader = new FileManager(this);
	this.history = new _History(this);
	this.storage = new _Storage();

	this.consts = {
		selectedClass: "selected",
		connectClass: "connect-node",
		circleGClass: "conceptG",
		graphClass: "graph",
		textClass: "id-text",
		activeEditId: "active-editing",
		BACKSPACE_KEY: 8,
		DELETE_KEY: 46,
		ENTER_KEY: 13,
		SHIFT_KEY: 16,
		CTRL_KEY: 17,
		nodeRadius: 20
	}

	this.defaults = {
		oneway: false,
	}

	this.state = {
		selectBrush: false,
		selectedNode: null,
		selectedNodes: [],
		selectedEdges: [],
		selectedEdge: null,
		mouseDownNode: null,
		mouseEnterNode: null,
		mouseDownLink: null,
		justDragged: false,
		justScaleTransGraph: false,
		lastKeyDown: -1,
		keyDown: [],
		shiftNodeDrag: false,
		selectedText: null,
		selectionBox: {},
		grid: { centre: { x: 0, y: 0 }, dimensions: { x: 10, y: 10 }, active: true, lines: { horizontal: [], vertical: []} },
	};

	this.backgroundImageData = {
		//url: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?fit=crop&w=200&h=200',
		x: 100,
		y: 10,
		height: 200,
		width: 200
	};

	this.graph = graph;

}

Editor.prototype = {
	addNode: function (node) {
		this.graph.createNode(node);
		this.signals.graphDataChanged.dispatch();
	},
	removeNode: function (node) {
		this.graph.removeNode(node);
		this.signals.graphDataChanged.dispatch();
	},
	addEdge: function (edge) {
		this.graph.createEdge(edge.source, edge.target, edge.oneway | this.defaults.oneway)
		this.signals.graphDataChanged.dispatch();
	},
	removeEdge: function (edge) {
		this.graph.removeEdge(edge);
		this.signals.graphDataChanged.dispatch();
	},
	moveNode: function (nodeId, nodeInfo) {
		let newNode = this.graph.setNode(nodeId, nodeInfo);
		this.signals.nodeDataChanged.dispatch(newNode);
		this.signals.graphDataChanged.dispatch();
	},
	setValue: function (nodeId, nodeInfo) {
		let newNode = this.graph.setNode(nodeId, nodeInfo);
		this.signals.nodeDataChanged.dispatch(newNode);
		this.signals.graphDataChanged.dispatch();
	},
	snapToGrid: function (x, y) {

		if (this.state.grid.active === true) {
			x = round(x, this.state.grid.dimensions.x) + this.state.grid.centre.x;
			y = round(y, this.state.grid.dimensions.y) + this.state.grid.centre.y;
		}

		function round(p, n) {
			return p % n < n / 2 ? p - (p % n) : p + n - (p % n);
		}
		return { x: x, y: y };
	},


	execute: function (cmd, optionalName) {

		this.history.execute(cmd, optionalName);

	},

	undo: function () {

		this.history.undo();

	},

	redo: function () {

		this.history.redo();

	},
	clear: function () {
		this.config.setKey('project/title', 'untitled')
		this.graph.resetGraph();
		this.history.clear();
		this.signals.graphDataChanged.dispatch();
	},
	toJSON: function () {

		return {

			metadata: {},
			project: {
				// project info
			},
			graph: this.graph.toJSON(),
			// history: this.history.toJSON()

		};

	},
	fromJSON: async function ( json ) {

		// this.history.fromJSON( json.history );
		this.graph.fromJSON( json.graph );
		this.signals.graphDataChanged.dispatch();
		this.signals.historyChanged.dispatch();

	},
}

export { Editor };
