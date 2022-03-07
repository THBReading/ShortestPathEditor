// import * as initUI from "./init_ui.js";
// import { width, height, graph, svg } from "./main.js";
// import { makeUL } from "./stuff.js"

import { AddNodeCommand } from "./commands/addNodeCommand.js";
import { RemoveNodeCommand } from "./commands/removeNodeCommand.js";
import { AddEdgeCommand } from "./commands/addEdgeCommand.js";
import { MoveNodeCommand } from "./commands/moveNodeCommand.js";
// import { RemoveEdgeCommand } from "./commands/removeEdgeCommand.js";


export class GraphEditor {
    constructor(editor) {
        let thisGraph = this;
        thisGraph.editor = editor;

        thisGraph.editor.signals.graphDataChanged.add(() => {
            this.updateGraph();
            // console.log("Graph Data Updated");
        })

        let svg = d3.select("#viewport").append("svg")
            .attr("width", window.innerWidth)
            .attr("height", window.innerHeight);

        thisGraph.svg = svg;

        thisGraph.consts = {
            selectedClass: "selected",
            connectClass: "connect-node",
            circleGClass: "conceptG",
            graphClass: "graph",
            textClass: "id-text",
            nodeLabelClass: "node-label",
            pathLabelClass: "path-label",
            activeEditId: "active-editing",
            BACKSPACE_KEY: 8,
            DELETE_KEY: 46,
            ENTER_KEY: 13,
            SHIFT_KEY: 16,
            CTRL_KEY: 17,
            nodeRadius: 20
        }

        thisGraph.defaults = {
            oneway: false,
        }

        thisGraph.state = {
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
            mode: MODES.default,
        };

        // define arrow markers for graph links
        let defs = svg.append('svg:defs');
        defs.append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', "17")
            .attr('markerWidth', 3.5)
            .attr('markerHeight', 3.5)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        // define arrow markers for leading arrow
        defs.append('svg:marker')
            .attr('id', 'mark-end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 7)
            .attr('markerWidth', 3.5)
            .attr('markerHeight', 3.5)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        // define arrow markers for graph links
        defs.append('svg:marker')
            .attr('id', 'start-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', "-7")
            .attr('markerWidth', 3.5)
            .attr('markerHeight', 3.5)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M10,-5L0,0L10,5');

        thisGraph.svg = svg;
        thisGraph.svgG = svg.append("g")
            .classed(thisGraph.consts.graphClass, true);
        let svgG = thisGraph.svgG;

        // displayed when dragging between nodes
        thisGraph.dragLine = svgG.append('svg:path')
            .attr('class', 'dragline hidden')
            .attr('d', 'M0,0L0,0')
            .style('marker-end', 'url(#mark-end-arrow)');

        thisGraph.selectionBox = svgG.append('svg:rect')
            .attr('class', 'selectionbox hidden')
            .attr('width', '0')
            .attr('height', '0');

        thisGraph.grid = svgG.append("g").classed("grid", true).selectAll("g");

        // svg nodes and edges
        thisGraph.backgroundImage = svgG.append("g").selectAll("g");
        thisGraph.paths = svgG.append("g").selectAll("g");
        thisGraph.circles = svgG.append("g").selectAll("g");
        thisGraph.pathLabels = svgG.append("g").selectAll("g");
        thisGraph.nodeLabels = svgG.append("g").selectAll("g");

        thisGraph.drag = d3.drag()
            .subject(function(d) {
                return { x: d.x, y: d.y };
            })
            .on("start", function(event, d) {
                thisGraph.dragStartPos = {...d };
            })
            .on("drag", function(event, d) {
                thisGraph.state.justDragged = true;
                thisGraph.dragmove.call(thisGraph, event, d);
            })
            .on("end", function(event, d) {
                thisGraph.dragEndPos = {...d };
                // if (!thisGraph.state.selectedNodes.includes(d)) {
                //     thisGraph.replaceSelectNode(d3.select(this), d)
                // }
                if (thisGraph.state.shiftNodeDrag) {
                    thisGraph.dragEnd.call(thisGraph, d3.select(this), event, thisGraph.state.mouseEnterNode);
                } else if (
                    (thisGraph.dragStartPos.x !== thisGraph.dragEndPos.x) ||
                    (thisGraph.dragStartPos.y !== thisGraph.dragEndPos.y)
                ) {
                    // TODO: Update for multiple nodes moving
                    if (!thisGraph.state.selectedNodes.includes(d)) {
                        thisGraph.replaceSelectNode(d3.select(this), d)
                    }
                    thisGraph.editor.execute(new MoveNodeCommand(thisGraph.editor, thisGraph.dragStartPos, thisGraph.dragEndPos));
                }

            });

        // listen for key events
        d3.select(window)
            .on("keydown", function(event) {
                thisGraph.svgKeyDown.call(thisGraph, event);
            })
            .on("keyup", function(event) {
                //console.log("keyup");
                thisGraph.svgKeyUp.call(thisGraph, event);
            });

        svg.on("mousedown", function(event, d) {
            thisGraph.svgMouseDown.call(thisGraph, event, d);
            if (event.shiftKey) {
                event.stopImmediatePropagation();
            }
        });
        svg.on("mouseup", function(event, d) {
            thisGraph.svgMouseUp.call(thisGraph, event, d);
        });

        // listen for dragging
        let dragSvg = d3.zoom()
            .extent([
                [0, 0],
                [window.innerWidth, window.innerHeight]
            ])
            .scaleExtent([0.3, 8])
            .on("zoom", function(event) {
                if (event.sourceEvent.shiftKey || event.sourceEvent.ctrlKey) {
                    // TODO  the internal d3 state is still changing
                    return false;
                } else {
                    thisGraph.zoomed.call(thisGraph, event);
                }
                return true;
            })
            .on("start", function(event) {
                if (!event.sourceEvent.shiftKey)
                    d3.select('body').style("cursor", "grab");
            })
            .on("end", function() {
                d3.select('body').style("cursor", "auto");
            }).filter(function(e) {
                return !e.altKey; //would like it to be ctrl but won't work
            });


        let dragSelectionBox = d3.drag().on('drag', function(event) {
                let xy = thisGraph.getXYCoordinates(event);
                thisGraph.selectionBox
                    .attr('height', xy.y - thisGraph.state.selectionBox.y)
                    .attr('width', xy.x - thisGraph.state.selectionBox.x);
                // console.log("draggin and stuff");
                //TODO: will need to save information somewhere and then draw from data 
            })
            .on('start', function(event) {
                // console.log('drag start');
                d3.select('.selectionbox').raise();
                let xy = thisGraph.getXYCoordinates(event);
                thisGraph.state.selectionBox.x = xy.x;
                thisGraph.state.selectionBox.y = xy.y;
                thisGraph.selectionBox.attr('x', xy.x).attr('y', xy.y);
                thisGraph.selectionBox.classed("hidden", false);

                console.log(thisGraph.state.selectionBox);
            })
            .on('end', function() {
                console.log('drag end');
                thisGraph.selectionBox.each(function(node, i) {
                    console.log(this.getBoundingClientRect());
                })
                thisGraph.selectionBox.classed("hidden", true);
                thisGraph.selectionBox.attr('height', 0).attr('width', 0);


                // thisGraph.circles.each(function (node, i) {
                //     console.log(this.getBoundingClientRect());
                // })
            })
            .filter(function(e) {
                return e.altKey; //would like it to be ctrl but won't work
            });

        svg.call(dragSvg).on("dblclick.zoom", null);
        svg.call(dragSelectionBox);
        // listen for resize
        window.onresize = function() {
            thisGraph.updateWindow(svg);
        };

        this.updateGraph()

    }
    dragmove(event, d) {
        let thisGraph = this;
        if (thisGraph.state.shiftNodeDrag || event.sourceEvent.shiftKey) {
            let xy = thisGraph.getXYCoordinates(event);
            thisGraph.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + xy.x + ',' + xy.y);
        } else {
            if (thisGraph.state.selectedNodes.length > 1 && thisGraph.state.selectedNodes.includes(d)) {
                // let xy = this.editor.snapToGrid(event.x, event.y);

                d3.selectAll("." + thisGraph.consts.selectedClass)
                    .attr("x", (d) => d ? d.x += event.dx : null)
                    .attr("y", (d) => d ? d.y += event.dy : null);

                // TODO: snap to grid and command with all moves
            } else {
                // d.x += event.dx;
                // d.y += event.dy;

                let xy = this.editor.snapToGrid(event.x, event.y);
                d.x = xy.x;
                d.y = xy.y;
            }
            // thisGraph.updateGraph();
            this.editor.signals.graphDataChanged.dispatch();
            this.editor.signals.nodeDataChanged.dispatch(d);
        }
    }
    dragEnd(d3node, event, d) {
            let thisGraph = this,
                state = thisGraph.state,
                consts = thisGraph.consts;
            // reset the states
            state.shiftNodeDrag = false;
            d3node.classed(consts.connectClass, false);

            let mouseDownNode = state.mouseDownNode;
            let mouseEnterNode = state.mouseEnterNode;

            if (state.justDragged) {
                // dragged, not clicked
                state.justDragged = false;
            }

            thisGraph.dragLine.classed("hidden", true);

            if (!mouseDownNode || !mouseEnterNode)
                return;


            if (mouseDownNode !== d) {
                // we're in a different node: create new edge for mousedown edge and add to graph
                let edge = { source: mouseDownNode, target: d }
                thisGraph.editor.execute(new AddEdgeCommand(thisGraph.editor, edge));
            }
            state.mouseDownNode = null;
            state.mouseEnterNode = null;
            return;
        }
        // keydown on main svg
    svgKeyDown(event) {
        let thisGraph = this,
            state = thisGraph.state,
            consts = thisGraph.consts,
            keyCode = event.keyCode;


        //TODO: create a class for this!
        var includes = function(what) {
                let array = state.keyDown
                return array.includes(what);
            },
            just = function(what) {
                let array = state.keyDown
                return array.includes(what) && array.length === 1;
            };

        // make sure repeated key presses don't register for each keydown
        // if (state.lastKeyDown !== -1) return;
        if (state.keyDown.includes(keyCode)) return;

        state.lastKeyDown = keyCode;

        state.keyDown.push(keyCode);
        // console.log(state.keyDown.toString());

        let selectedNodes = state.selectedNodes,
            selectedEdges = state.selectedEdges;
        // console.log(state.keyDown, [consts.BACKSPACE_KEY]);

        if (just(consts.DELETE_KEY) || just(consts.BACKSPACE_KEY)) {
            event.preventDefault();
            if (selectedNodes.length) {
                selectedNodes.forEach( // TODO: change to batch command
                    (selectedNode) => thisGraph.editor.execute(new RemoveNodeCommand(thisGraph.editor, selectedNode))
                );

                state.selectedNode = null;
                state.selectedNodes = [];
                thisGraph.updateGraph();
            } else if (selectedEdges.length) {
                selectedEdges.forEach(
                    (selectedEdge) => thisGraph.editor.graph.removeEdge(selectedEdge)
                );

                state.selectedEdge = null;
                state.selectedEdges = [];
                thisGraph.updateGraph();
            }
        } else if (just(consts.SHIFT_KEY)) {
            state.mode = MODES.create;
        } else if (includes(consts.CTRL_KEY) && includes(65)) {
            console.log("Select All");
            thisGraph.selectNodes(d3.selectAll("." + consts.circleGClass));
            thisGraph.updateGraph();
        } else if (just(consts.CTRL_KEY)) {
            // thisGraph.svg.append('g')
            //     .attr('class', 'brush')
            //     .call(thisGraph.brush);
        }
    }
    svgKeyUp() {
            this.state.keyDown = [];
            this.state.lastKeyDown = -1;
            this.state.mode = MODES.default;
        }
        // mousedown on main svg
    svgMouseDown() {
        this.state.graphMouseDown = true;
    }
    getXYCoordinates(event) {
            let thisGraph = this,
                pt = thisGraph.svg.node().createSVGPoint(),
                xyAll = d3.pointer(event, d3.select("." + thisGraph.consts.graphClass).node());
            pt.x = xyAll[0];
            pt.y = xyAll[1];
            return pt;
        }
        // mouseup on main svg
    svgMouseUp(event) {
        let thisGraph = this,
            state = thisGraph.state;
        if (state.justScaleTransGraph) {
            // dragged not clicked
            state.justScaleTransGraph = false;
        } else if (state.graphMouseDown && state.mode === MODES.create) {
            let xy = thisGraph.getXYCoordinates(event);
            xy = this.editor.snapToGrid(xy.x, xy.y);
            thisGraph.editor.execute(new AddNodeCommand(thisGraph.editor, { x: xy.x, y: xy.y }));

        } else if (state.graphMouseDown && state.mode === MODES.create && event.ctrlKey) {
            //get selected node
            let selected = thisGraph.state.selectedNodes;
            let xy = thisGraph.getXYCoordinates(event);
            let newNode = thisGraph.editor.graph.createNode(xy.x, xy.y);

            if (selected.length == 1) {
                let prevNode = selected[0];
                thisGraph.editor.graph.createEdge(newNode, prevNode, thisGraph.defaults.oneway);
            };



            //create edge to newly created node
            // select new node
            thisGraph.removeSelectFromAllNodes();
            thisGraph.updateGraph();
            thisGraph.selectNodeById(newNode.id);
            // thisGraph.updateGraph();
        } else if (state.shiftNodeDrag) {
            // dragged from node
            state.shiftNodeDrag = false;
            thisGraph.dragLine.classed("hidden", true);
        } else {
            //console.log("click Click Click!!!");
        }
        state.graphMouseDown = false;
    }
    pathMouseDown(d3path, event, d) {
            let thisGraph = this,
                state = thisGraph.state;
            event.stopPropagation();
            state.mouseDownLink = d;

            if (state.selectedNode) {
                thisGraph.removeSelectFromAllNodes();
            }

            if (!state.selectedEdges.includes(d)) {
                if (event.ctrlKey) {
                    thisGraph.selectEdge(d3path, d);
                } else {
                    thisGraph.replaceSelectEdge(d3path, d);
                };
            } else {
                if (state.selectedEdges.length > 1 && !event.ctrlKey) {
                    thisGraph.replaceSelectEdge(d3path, d);
                } else {
                    thisGraph.removeSelectFromEdge(d3path);
                }
            }
        }
        // mousedown on node
    circleMouseDown(xyz, event, d) {
            let thisGraph = this,
                state = thisGraph.state;
            event.stopPropagation();
            state.mouseDownNode = d;
            // console.log(`mousedownnode = ${JSON.stringify(d)}`);
            if (event.shiftKey) {
                state.shiftNodeDrag = event.shiftKey;
                // reposition dragged directed edge
                thisGraph.dragLine.classed('hidden', false)
                    .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
                return;
            }
        }
        // mouseup on nodes
    circleMouseUp(d3node, event, d) {
        let thisGraph = this,
            state = thisGraph.state,
            consts = thisGraph.consts;
        // reset the states
        state.shiftNodeDrag = false;
        d3node.classed(consts.connectClass, false);

        if (state.selectedEdge) { thisGraph.removeSelectFromAllEdges(); }
        if (!state.selectedNodes.includes(d)) {
            if (event.ctrlKey) {
                thisGraph.selectNode(d3node, d);
            } else {
                thisGraph.replaceSelectNode(d3node, d);
            }
        } else {
            if (state.selectedNodes.length > 1 && !event.ctrlKey) {
                thisGraph.replaceSelectNode(d3node, d);
            } else {
                thisGraph.removeSelectFromNode(d3node);
            }

        }

    }
    selectEdge(d3path, edgeData) {
        let thisGraph = this;
        d3path.classed(thisGraph.consts.selectedClass, true);
        thisGraph.state.selectedEdge = edgeData;
        thisGraph.state.selectedEdges.push(edgeData);
        //thisGraph.updateSidebar();
    }
    selectNode(d3node, nodeData) {
        let thisGraph = this;
        d3node.classed(thisGraph.consts.selectedClass, true);
        thisGraph.state.selectedNode = nodeData;
        thisGraph.state.selectedNodes.push(nodeData);
        this.editor.state.selectedNode = nodeData;
        this.editor.state.selectedNodes.push(nodeData);
        //thisGraph.updateSidebar();
        thisGraph.shortestPath();
        thisGraph.editor.signals.objectSelected.dispatch(this.editor.state.selectedNodes);
    }

    selectNodes(selection) {
        let thisGraph = this;
        selection.classed(thisGraph.consts.selectedClass, true);
        thisGraph.state.selectedNode = selection.data()[0];
        thisGraph.state.selectedNodes.push(...selection.data());
        // thisGraph.updateSidebar();
    }

    selectNodeById(nodeId) {
        let thisGraph = this;
        thisGraph.selectNode(d3.select('#id' + nodeId), d3.select('#id' + nodeId).data()[0]);
    }

    replaceSelectEdge(d3path, edgeData) {
        let thisGraph = this;
        if (thisGraph.state.selectedEdges.length) {
            thisGraph.removeSelectFromAllEdges();
        }
        thisGraph.selectEdge(d3path, edgeData);
    }
    replaceSelectNode(d3node, nodeData) {
        let thisGraph = this;
        if (thisGraph.state.selectedNodes.length) {
            thisGraph.removeSelectFromAllNodes();
        }
        thisGraph.selectNode(d3node, nodeData);
    }
    removeSelectFromNode(d3node) {
        let thisGraph = this;
        d3node.classed(thisGraph.consts.selectedClass, false);
        thisGraph.state.selectedNode = null;
        this.editor.state.selectedNode = null;
        this.editor.state.selectedNodes.splice(thisGraph.state.selectedNodes.indexOf(d3node), 1);
        thisGraph.state.selectedNodes.splice(thisGraph.state.selectedNodes.indexOf(d3node), 1);
        thisGraph.editor.signals.objectSelected.dispatch(this.editor.state.selectedNodes);
        // thisGraph.updateSidebar();
        thisGraph.shortestPath();
    }
    removeSelectFromEdge(d3path) {
        let thisGraph = this;
        d3path.classed(thisGraph.consts.selectedClass, false);
        thisGraph.state.selectedEdge = null;
        thisGraph.state.selectedEdges.splice(thisGraph.state.selectedEdges.indexOf(d3path), 1);
        thisGraph.editor.signals.objectSelected.dispatch(this.editor.state.selectedNodes);
        // thisGraph.updateSidebar();
    }
    removeSelectFromAllEdges() {
        let thisGraph = this;
        thisGraph.paths.filter(function(cd) {
            return thisGraph.state.selectedEdges.includes(cd);
        }).classed(thisGraph.consts.selectedClass, false);
        thisGraph.state.selectedEdge = null;
        thisGraph.state.selectedEdges = [];
        thisGraph.editor.signals.objectSelected.dispatch(this.editor.state.selectedNodes);
        // thisGraph.updateSidebar();
    }
    removeSelectFromAllNodes() {
        let thisGraph = this;
        thisGraph.circles.filter(function(cd) {
            return thisGraph.state.selectedNodes.includes(cd);
        }).classed(thisGraph.consts.selectedClass, false);


        thisGraph.state.selectedNode = null;
        thisGraph.state.selectedNodes = [];

        this.editor.state.selectedNode = null;
        this.editor.state.selectedNodes = [];

        thisGraph.editor.signals.objectSelected.dispatch(this.editor.state.selectedNodes);

        // thisGraph.updateSidebar();
    }
    getSelected() {
        let thisGraph = this;
        return d3.selectAll("." + thisGraph.consts.selectedClass);
    }
    deleteGraph(skipPrompt) {
        let thisGraph = this,
            doDelete = true;
        if (!skipPrompt) {
            doDelete = window.confirm("Press OK to delete this graph");
        }
        if (doDelete) {
            thisGraph.editor.graph.resetGraph();
            thisGraph.updateGraph();
        }
    }
    shortestPath() {
        let thisGraph = this;
        thisGraph.editor.graph.createAdjancency();
        d3.selectAll('.start-node').classed("start-node", false);
        d3.selectAll('.end-node').classed("end-node", false);
        d3.selectAll('.visited').classed("visited", false);

        let selectedArray = thisGraph.state.selectedNodes.map(node => node.id);
        let result = thisGraph.editor.graph.findShortestPathsFromArray(selectedArray);

        // d3.select('#id' + selectedArray[0]).classed("start-node", true);
        // d3.select('#id' + selectedArray[1]).classed("end-node", true);
        thisGraph.classNodes(result.path, "visited");
        thisGraph.updateGraph();
    }
    align(dimension = 'x', mode = 3) {

        //0: left/top, 1:middle, 2:right/bottom

        let xORy = dimension;
        let thisGraph = this;
        let selection = d3.selectAll("." + thisGraph.consts.selectedClass);
        let data = selection.data();
        data.sort((a, b) => a[xORy] - b[xORy]);
        let max = data[data.length - 1];
        let min = data[0];
        // let min = data.reduce((min, node) => (min[xORy] < node[xORy]) ? min : node);

        let changeTo = null,
            changeToArray = null;
        switch (mode) {
            case 0: //top or left
                changeTo = min[xORy];
                break;
            case 1: //middle
                changeTo = min[xORy] + ((max[xORy] - min[xORy]) / 2);
                break;
            case 2: //bottom or right
                changeTo = max[xORy];
                break;
            case 3: //equal spread
                let spreadDistance = (max[xORy] - min[xORy]) / (data.length - 1);
                data.forEach((node, index) => {
                    node.x = min[xORy] + (index * spreadDistance);
                })
                changeToArray = data;
                break;
            case 4:

                break;
            default:
                // code block
        }

        if (changeTo !== null) {
            d3.selectAll("." + thisGraph.consts.selectedClass)
                .attr([xORy], (d) => d[xORy] = changeTo);
        } else if (changeToArray !== null) {
            d3.selectAll("." + thisGraph.consts.selectedClass)
                .attr([xORy], (d) => d[xORy] = changeToArray.find((node) => node.id === d.id)[xORy]);
        };
        thisGraph.updateGraph();
    }
    classNodes(idArray, className) {
            return idArray.forEach((node, idx, array) => {
                let node1 = array[idx],
                    node2 = array[idx + 1];
                d3.select('#id' + node).classed(className, true);

                if (node1 !== node2 && !(node1 === undefined || node2 === undefined)) {
                    d3.select('#id' + node1 + "-" + node2).classed(className, true);
                    d3.select('#id' + node2 + "-" + node1).classed(className, true);
                }
            });
        }
        // call to propagate changes to graph
    updateGraph() {
        let thisGraph = this,
            consts = thisGraph.consts,
            state = thisGraph.state;
        // let arr = d3.range(0, 100);
        // let  arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99];


        // /** Grid */
        // thisGraph.grid = thisGraph.grid.data(arr);
        // let grid = thisGraph.grid;
        // // update existing grid
        // // remove old links
        // grid.exit().remove();

        // // add new grid
        // // grid = grid.enter();

        // grid.enter().append("path")
        //     .attr("d", function (d) {
        //         return "M" + d * editor.state.grid.dimensions.x + "," + 0 + "L" + d * editor.state.grid.dimensions.x + "," + window.innerWidth;
        //     })
        //     .merge(grid)
        // // add new grid
        // // grid.append("path")
        // //     .attr("d", function (d) {
        // //         return "M" + 0 + "," + d * editor.state.grid.dimensions.y + "L" + window.innerHeight + "," + d * editor.state.grid.dimensions.y;
        // //     })
        // //     .merge(grid)

        // thisGraph.grid = grid;

        ////////

        thisGraph.backgroundImage = thisGraph.backgroundImage.data(
            [this.editor.backgroundImageData]
        );
        let backgroundImage = thisGraph.backgroundImage;
        // update existing image
        backgroundImage.attr('xlink:href', d => d.url)
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('width', d => d.width)
            .attr('height', d => d.height);

        // remove old image
        backgroundImage.exit().remove();

        // add new image
        backgroundImage = backgroundImage.enter()
            .append('image')
            .attr('xlink:href', d => d.url)
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('width', d => d.width)
            .attr('height', d => d.height);

        thisGraph.backgroundImage = backgroundImage;

        ///////////////////////////////////////////

        thisGraph.paths = thisGraph.paths.data(thisGraph.editor.graph.edges, function(d) {
            return String(d.source.id) + "+" + String(d.target.id);
        });
        let paths = thisGraph.paths;
        // update existing paths
        paths.style('marker-end', 'url(#end-arrow)')
            .style('marker-start', function(d) { return !d.oneway ? 'url(#start-arrow)' : ''; })
            .classed(consts.selectedClass, function(d) {
                return d === state.selectedEdge;
            })
            // .attr("d", line([d.source.x, d.source.y, d.target.x, d.target.y]));
            .attr("d", function(d) {
                return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
            });

        // remove old links
        paths.exit().remove();

        // add new paths
        paths = paths.enter()
            .append("path")
            .style('marker-end', 'url(#end-arrow)')
            .style('marker-start', function(d) { return !d.oneway ? 'url(#start-arrow)' : ''; })
            .classed("link", true)
            .attr("id", function(d) { return "id" + d.source.id + "-" + d.target.id })
            .attr("d", function(d) {
                return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
            })
            .merge(paths)
            .on("mouseup", function(d) {
                console.log('mouseup link');
                state.mouseDownLink = null;
            })
            .on("mousedown", function(event, d) {
                thisGraph.pathMouseDown.call(thisGraph, d3.select(this), event, d);
            })

        thisGraph.paths = paths;

        ///////////////////////////////////////////

        thisGraph.pathLabels = thisGraph.pathLabels.data(thisGraph.editor.graph.edges, function(d) {
            return String(d.source.id) + "+" + String(d.target.id);
        });
        let pathLabels = thisGraph.pathLabels;
        // update existing paths
        pathLabels
            .attr("x", function(d) { return ((d.source.x + d.target.x) / 2); })
            .attr("y", function(d) { return ((d.source.y + d.target.y) / 2); })
            .text(function(d) {
                let option = thisGraph.editor.config.getKey('settings/edgetext')
                switch (option) {
                    case "weight":
                        return Math.sqrt(
                            Math.pow(Math.abs(d.source.x - d.target.x), 2) +
                            Math.pow(Math.abs(d.source.y - d.target.y), 2)
                        ).toFixed(0) + "cm"
                    case "":
                        return;
                    default:
                        return d[option];
                }
            })
            .attr("transform", function(d) {
                let xMid = ((d.source.x + d.target.x) / 2),
                    yMid = ((d.source.y + d.target.y) / 2),
                    angle = Math.atan2(d.source.y - d.target.y, d.source.x - d.target.x);
                angle *= 180 / Math.PI;
                angle += Math.trunc(angle / 90) === 0 ? 0 : 180;
                return "rotate(" + angle + "," + xMid + "," + yMid + ")";
            })

        // remove old links
        pathLabels.exit().remove();

        // add new paths
        pathLabels = pathLabels.enter()
            .append("text")
            .attr("x", function(d) { return ((d.source.x + d.target.x) / 2); })
            .attr("y", function(d) { return ((d.source.y + d.target.y) / 2); })
            .text(function(d) {
                let option = thisGraph.editor.config.getKey('settings/edgetext')
                switch (option) {
                    case "weight":
                        return Math.sqrt(
                            Math.pow(Math.abs(d.source.x - d.target.x), 2) +
                            Math.pow(Math.abs(d.source.y - d.target.y), 2)
                        ).toFixed(0) + "cm"
                    case "":
                        return;
                    default:
                        return d[option];
                }
            })
            .attr("transform", function(d) {
                let xMid = ((d.source.x + d.target.x) / 2),
                    yMid = ((d.source.y + d.target.y) / 2),
                    angle = Math.atan2(d.source.y - d.target.y, d.source.x - d.target.x);
                angle *= 180 / Math.PI;
                angle += Math.trunc(angle / 90) === 0 ? 0 : 180;
                return "rotate(" + angle + "," + xMid + "," + yMid + ")";
            })
            .classed(consts.pathLabelClass, true)
            .attr("dy", ".35em")
            .merge(pathLabels)

        thisGraph.pathLabels = pathLabels;


        /////////////////////////////////////////////

        // update existing nodes
        thisGraph.circles = thisGraph.circles.data(thisGraph.editor.graph.nodes, function(d) {
            return d.id;
        });

        // remove old nodes
        thisGraph.circles.exit().remove();

        thisGraph.circles.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });


        // add new nodes
        let newGs = thisGraph.circles.enter()
            .append("g").merge(thisGraph.circles);

        newGs.classed(consts.circleGClass, true)
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .attr("id", function(d) { return "id" + d.id })
            .on("mouseover", function(event, d) {
                state.mouseEnterNode = d;
                if (state.shiftNodeDrag) {
                    d3.select(this).classed(consts.connectClass, true);
                }
            })
            .on("mouseout", function(d) {
                state.mouseEnterNode = null;
                d3.select(this).classed(consts.connectClass, false);
            })
            .on("mousedown", function(event, d) {
                thisGraph.circleMouseDown.call(thisGraph, d3.select(this), event, d);
            })
            .on("click", function(event, d) {
                thisGraph.circleMouseUp.call(thisGraph, d3.select(this), event, d);
            })
            .call(thisGraph.drag);

        thisGraph.circles = newGs;

        // Add Circles on Node to make visible
        thisGraph.circles.each(function(d) {
            if (this.childNodes.length === 0) {
                d3.select(this)
                    .append("circle")
                    .attr("r", String(consts.nodeRadius));

                // d3.select(this).append("text")
                //     .attr("text-anchor", "middle")
                //     .attr('alignment-baseline', 'central')
                //     .classed(thisGraph.consts.textClass, true)
                //     .text(d => d.title);
            }
        });


        //////////////////////////////////////////

        thisGraph.nodeLabels = thisGraph.nodeLabels.data(thisGraph.editor.graph.nodes, function(d) {
            return String(d.id);
        });
        let nodeLabels = thisGraph.nodeLabels;
        // update existing paths
        nodeLabels
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .text((d) => d[thisGraph.editor.config.getKey('settings/nodetext')])

        // remove old links
        nodeLabels.exit().remove();

        // add new paths
        nodeLabels = nodeLabels.enter()
            .append("text")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .text((d) => d[thisGraph.editor.config.getKey('settings/nodetext')])
            .classed(consts.nodeLabelClass, true)
            .attr("dy", ".35em")
            .merge(nodeLabels)

        thisGraph.nodeLabels = nodeLabels;

        ///////////////////////////////////////////

        // thisGraph.updateSidebar();

    }
    zoomed(event) {
        this.state.justScaleTransGraph = true;
        d3.select("." + this.consts.graphClass)
            .attr("transform", event.transform);
    }
    updateWindow(svg) {
        let docEl = document.documentElement,
            bodyEl = document.getElementsByTagName('body')[0];
        let x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
        let y = window.innerHeight || docEl.clientHeight || bodyEl.clientHeight;
        svg.attr("width", x).attr("height", y);
    }
}

const MODES = {
    default: "default",
    create: "create",
    edit: "edit",
}