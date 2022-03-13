import { AddNodeCommand } from "./commands/addNodeCommand.js";
import { RemoveNodeCommand } from "./commands/removeNodeCommand.js";
import { AddEdgeCommand } from "./commands/addEdgeCommand.js";
import { MoveNodeCommand } from "./commands/moveNodeCommand.js";
import { RemoveEdgeCommand } from "./commands/removeEdgeCommand.js";
import { SetValueCommand } from "./commands/setValueCommand.js";
import { MultiCmdsCommand } from "./commands/multiCmdsCommand.js";

export class GraphEditor {

    constructor(editor) {
        let thisGraph = this;
        thisGraph.editor = editor,
            this.MODES = editor.MODES;

        thisGraph.editor.signals.graphDataChanged.add(() => {
            this.updateGraph();
            // console.log("Graph Data Updated");
        })

        let svg = d3.select("#viewport").append("svg")
            .attr("width", window.innerWidth)
            .attr("height", window.innerHeight);

        thisGraph.svg = svg;

        thisGraph.gridDataX = d3.range(0, ((window.innerWidth / editor.state.grid.transform.k) / thisGraph.editor.state.grid.dimensions.x) + 1);
        thisGraph.gridDataY = d3.range(0, ((window.innerHeight / editor.state.grid.transform.k) / thisGraph.editor.state.grid.dimensions.y) + 1);

        thisGraph.consts = {
            selectedClass: "g-selected",
            connectClass: "g-drop-node",
            circleGClass: "g-node",
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

        thisGraph.svgGrid = svg.append("g")
            .classed("grid", true);
        let svgGrid = thisGraph.svgGrid;

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

        thisGraph.gridX = svgGrid.append("g").selectAll("g");
        thisGraph.gridY = svgGrid.append("g").selectAll("g");

        // svg nodes and edges
        thisGraph.backgroundImage = svgG.append("g").selectAll("g");
        thisGraph.paths = svgG.append("g").selectAll("g");
        thisGraph.circles = svgG.append("g").selectAll("g");
        thisGraph.pathLabels = svgG.append("g").selectAll("g");
        thisGraph.nodeLabels = svgG.append("g").selectAll("g");

        thisGraph.drag = d3.drag()
            .subject(function (d) {
                return { x: d.x, y: d.y };
            })
            .on("start", function (event, d) {
                thisGraph.dragStartPos = { ...d };
                // if (!thisGraph.editor.state.selected.includes(d)) {
                //     thisGraph.replaceSelect(d3.select(this))
                // }
            })
            .on("drag", function (event, d) {
                thisGraph.editor.state.justDragged = true;
                thisGraph.dragmove.call(thisGraph, event, d);
            })
            .on("end", function (event, d) {
                d3.selectAll(".snap").classed("snap", false)
                thisGraph.dragEndPos = { ...d };
                if (thisGraph.editor.state.shiftNodeDrag) {
                    thisGraph.dragEnd.call(thisGraph, d3.select(this), event, thisGraph.editor.state.mouseEnterNode);
                } else if (
                    (thisGraph.dragStartPos.x !== thisGraph.dragEndPos.x) ||
                    (thisGraph.dragStartPos.y !== thisGraph.dragEndPos.y)
                ) {
                    if (thisGraph.editor.state.selected.length <= 1) {
                        thisGraph.editor.execute(new MoveNodeCommand(thisGraph.editor, thisGraph.dragStartPos, thisGraph.dragEndPos));
                    }
                    else if (thisGraph.editor.state.selected.length > 1) {
                        let xDiff = thisGraph.dragStartPos.x - thisGraph.dragEndPos.x,
                            yDiff = thisGraph.dragStartPos.y - thisGraph.dragEndPos.y,
                            cmdStack = [];

                        thisGraph.editor.state.selected.forEach(selectedObject => {
                            if (selectedObject.x !== undefined && selectedObject.y !== undefined) {
                                let start = { ...selectedObject };
                                start.x += xDiff;
                                start.y += yDiff;

                                cmdStack.push(new MoveNodeCommand(thisGraph.editor, start, selectedObject))
                            }

                        });

                        thisGraph.editor.execute(new MultiCmdsCommand(thisGraph.editor, cmdStack, 'Move Multiple Nodes'))
                    }
                }

            });

        svg.on("click", function (event, d) {
            event.stopImmediatePropagation();
            // thisGraph.svgMouseDown.call(thisGraph, event, d);
            thisGraph.svgClick.call(thisGraph, event, d);
        });

        // listen for dragging
        let dragSvg = d3.zoom()
            .extent([
                [0, 0],
                [window.innerWidth, window.innerHeight]
            ])
            .scaleExtent([0.3, 10])
            .on("zoom", function (event) {
                if (event.sourceEvent.shiftKey || event.sourceEvent.ctrlKey) {
                    // TODO  the internal d3 state is still changing
                    return false;
                } else {
                    thisGraph.zoomed.call(thisGraph, event);
                }
                return true;
            })
            .on("start", function (event) {
                if (!event.sourceEvent.shiftKey)
                    d3.select('svg').style("cursor", "grabbing");
            })
            .on("end", function () {
                d3.select('svg').style("cursor", "");
            }).filter(function (e) {
                return !e.altKey; //would like it to be ctrl but won't work
            });


        let dragSelectionBox = d3.drag().on('drag', function (event) {
            let xy = thisGraph.getXYCoordinates(event);
            thisGraph.selectionBox
                .attr('height', xy.y - thisGraph.editor.state.selectionBox.y)
                .attr('width', xy.x - thisGraph.editor.state.selectionBox.x);
            // console.log("draggin and stuff");
            //TODO: will need to save information somewhere and then draw from data 
        })
            .on('start', function (event) {
                // console.log('drag start');
                d3.select('.selectionbox').raise();
                let xy = thisGraph.getXYCoordinates(event);
                thisGraph.editor.state.selectionBox.x = xy.x;
                thisGraph.editor.state.selectionBox.y = xy.y;
                thisGraph.selectionBox.attr('x', xy.x).attr('y', xy.y);
                thisGraph.selectionBox.classed("hidden", false);

                console.log(thisGraph.editor.state.selectionBox);
            })
            .on('end', function () {
                console.log('drag end');
                thisGraph.selectionBox.each(function (node, i) {
                    console.log(this.getBoundingClientRect());
                })
                thisGraph.selectionBox.classed("hidden", true);
                thisGraph.selectionBox.attr('height', 0).attr('width', 0);


                // thisGraph.circles.each(function (node, i) {
                //     console.log(this.getBoundingClientRect());
                // })
            })
            .filter(function (e) {
                return e.altKey; //would like it to be ctrl but won't work
            });

        svg.call(dragSvg).on("dblclick.zoom", null);
        svg.call(dragSelectionBox);
        // listen for resize
        window.onresize = function () {
            thisGraph.updateWindow(svg);
        };

        this.updateGraph()



    }
    dragmove(event, d) {
        let thisGraph = this;

        if (thisGraph.editor.state.shiftNodeDrag || thisGraph.editor.state.mode === thisGraph.MODES.create) {
            let xy = thisGraph.getXYCoordinates(event);
            thisGraph.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + xy.x + ',' + xy.y);
        } else {
            if (thisGraph.editor.state.selected.length > 1 && thisGraph.editor.state.selected.includes(d)) {
                let xy = this.editor.snapToGrid(event.x, event.y);
                let x = d.x, y = d.y;

                let diffX = xy.x - x;
                let diffY = xy.y - y;

                d3.selectAll("." + thisGraph.consts.selectedClass)
                    .attr("x", (d) => d ? d.x += diffX : null)
                    .attr("y", (d) => d ? d.y += diffY : null);

                // TODO: snap to grid and command with all moves
            } else {
                let xy = this.editor.snapToGrid(event.x, event.y);
                d.x = xy.x;
                d.y = xy.y;

                console.log(xy.y + thisGraph.editor.state.grid.transform.y)
                d3.selectAll(".snap").classed("snap", false)
                d3.select("#x" + xy.x).classed("snap", true)
                d3.select("#y" + xy.y + thisGraph.editor.state.grid.transform.y).classed("snap", true)
            }
            // thisGraph.updateGraph();
            this.editor.signals.graphDataChanged.dispatch();
        }
    }
    dragEnd(d3node, event, d) {
        let thisGraph = this,
            state = thisGraph.editor.state,
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

    getXYCoordinates(event) {
        let thisGraph = this,
            pt = thisGraph.svg.node().createSVGPoint(),
            xyAll = d3.pointer(event, d3.select("." + thisGraph.consts.graphClass).node());
        pt.x = xyAll[0];
        pt.y = xyAll[1];
        return pt;
    }
    // mouseup on main svg
    svgClick(event) {
        let thisGraph = this,
            state = thisGraph.editor.state;
        if (state.justScaleTransGraph) {
            // dragged not clicked
            state.justScaleTransGraph = false;
        } else if (/* state.graphMouseDown && */ state.mode === thisGraph.MODES.create) {
            let xy = thisGraph.getXYCoordinates(event);
            xy = this.editor.snapToGrid(xy.x, xy.y);
            thisGraph.editor.execute(new AddNodeCommand(thisGraph.editor, { x: xy.x, y: xy.y }));

        } else if (/* state.graphMouseDown && */ state.mode === thisGraph.MODES.create && event.ctrlKey) {
            //get selected node
            // TODO: make this work i suppose?
            let selected = thisGraph.editor.state.selected;
            let xy = thisGraph.getXYCoordinates(event);
            let newNode = thisGraph.editor.graph.createNode(xy.x, xy.y);

            if (selected.length == 1) {
                let prevNode = selected[0];
                thisGraph.editor.graph.createEdge(newNode, prevNode, thisGraph.defaults.oneway);
            };

            //create edge to newly created node
            // select new node
            thisGraph.removeSelectFromAll();
            thisGraph.updateGraph();
            thisGraph.selectById(newNode.id);
            // thisGraph.updateGraph();
        } else if (state.shiftNodeDrag) {
            // dragged from node
            state.shiftNodeDrag = false;
            thisGraph.dragLine.classed("hidden", true);
        } else {
            thisGraph.removeSelectFromAll();
        }
        state.graphMouseDown = false;
    }
    pathMouseDown(d3Object, event, d) {
        let thisGraph = this,
            state = thisGraph.editor.state;
        event.stopPropagation();
        state.mouseDownLink = d;

        if (event.ctrlKey) {
            if (state.selected.includes(d)) {
                thisGraph.removeSelect(d3Object);
            } else {
                thisGraph.select(d3Object);
            }

        } else {
            if (state.selected.includes(d)) {
                thisGraph.removeSelect(d3Object);
            } else {
                thisGraph.replaceSelect(d3Object);
            }
        }

    }
    // mousedown on node
    circleMouseDown(xyz, event, d) {
        let thisGraph = this,
            state = thisGraph.editor.state;
        event.stopPropagation();
        state.mouseDownNode = d;
        if (state.mode === thisGraph.MODES.create) {
            state.shiftNodeDrag = state.mode === thisGraph.MODES.create;
            // reposition dragged directed edge
            thisGraph.dragLine.classed('hidden', false)
                .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
            return;
        }
    }
    // mouseup on nodes
    circleMouseUp(d3Object, event, d) {
        let thisGraph = this,
            state = thisGraph.editor.state,
            consts = thisGraph.consts;
        // reset the states
        state.shiftNodeDrag = false;
        d3Object.classed(consts.connectClass, false);

        if (event.ctrlKey) {
            if (state.selected.includes(d)) {
                thisGraph.removeSelect(d3Object);
            } else {
                thisGraph.select(d3Object);
            }

        } else {
            if (state.selected.includes(d)) {
                if(state.selected.length ===1){
                    thisGraph.removeSelect(d3Object);
                } else {
                    thisGraph.replaceSelect(d3Object);
                }
            } else {
                thisGraph.replaceSelect(d3Object);
            }
        }

    }

    /////////////////////

    select(d3Object) {

        let thisGraph = this;

        d3Object.classed(thisGraph.consts.selectedClass, true);

        this.editor.state.selected.push(...d3Object.data());

        thisGraph.editor.signals.objectSelected.dispatch(this.editor.state.selected);

        thisGraph.shortestPath();

    }

    selectById(id) {

        let thisGraph = this;

        thisGraph.select(d3.select('#id' + id));

    }

    replaceSelect(d3Object) {

        let thisGraph = this;

        if (thisGraph.editor.state.selected.length) {

            thisGraph.removeSelectFromAll();

        }

        thisGraph.select(d3Object);

    }

    removeSelect(d3Object) {

        let thisGraph = this;

        d3Object.classed(thisGraph.consts.selectedClass, false);

        this.editor.state.selected.splice(thisGraph.editor.state.selected.indexOf(d3Object), 1);

        thisGraph.editor.signals.objectSelected.dispatch(this.editor.state.selected);

        thisGraph.shortestPath();

    }

    removeSelectFromAll() {

        let thisGraph = this;

        thisGraph.getSelected().classed(thisGraph.consts.selectedClass, false);

        this.editor.state.selected = [];

        thisGraph.editor.signals.objectSelected.dispatch(this.editor.state.selected);

        thisGraph.shortestPath();

    }

    getSelected() {

        let thisGraph = this;

        return d3.selectAll("." + thisGraph.consts.selectedClass);

    }

    deleteSelected() {
        let thisGraph = this,
            selected = thisGraph.editor.state.selected;

        if (selected.length) {
            if (selected.length > 1) {
                let cmdStackNode = [],
                    cmdStackEdge = [];
                selected.forEach(
                    function (select) {
                        if (select.x && select.y && !select.target && !select.source) {
                            cmdStackNode.push(new RemoveNodeCommand(thisGraph.editor, select));
                            //TODO: And any edges that will be removed because of this command
                        } else if (!select.x && !select.y && select.target && select.source) {
                            cmdStackEdge.push(new RemoveEdgeCommand(thisGraph.editor, select));
                        }
                    }
                );

                thisGraph.editor.execute(new MultiCmdsCommand(thisGraph.editor, [...cmdStackEdge, ...cmdStackNode], 'Delete Multiple Nodes'))

            } else if (selected.length === 1) {
                let select = selected[0];
                if (select.x !== undefined && select.y !== undefined && select.target === undefined && select.source === undefined) {
                    thisGraph.editor.execute(new RemoveNodeCommand(thisGraph.editor, select));
                } else if (select.x === undefined && select.y === undefined && select.target !== undefined && select.source !== undefined) {
                    thisGraph.editor.execute(new RemoveEdgeCommand(thisGraph.editor, select));
                }
            }

            thisGraph.editor.state.selected = [];
            thisGraph.updateGraph();
        }
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

    //////////////////////////////////////////

    shortestPath() {

        let thisGraph = this;

        thisGraph.editor.graph.createAdjancency();

        d3.selectAll('.start-node').classed("start-node", false);
        d3.selectAll('.end-node').classed("end-node", false);
        d3.selectAll('.visited').classed("visited", false);

        let selectedArray = thisGraph.editor.state.selected.map(node => node.id);

        let result = thisGraph.editor.graph.findShortestPathsFromArray(selectedArray);

        thisGraph.classNodes(result.path, "visited");

        // thisGraph.updateGraph();

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
            state = thisGraph.editor.state,
            showGrid = editor.state.grid.active && thisGraph.gridDataX.length <= window.innerWidth * editor.state.grid.threshold;

        // /** Grid */ TODO: Centre on a node etc
        thisGraph.gridX = thisGraph.gridX.data(showGrid ? thisGraph.gridDataX : []);
        let gridX = thisGraph.gridX;

        gridX.attr("d", function (d) {
            return "M" + d * editor.state.grid.dimensions.x + "," + (-editor.state.grid.dimensions.x) + "L" + d * editor.state.grid.dimensions.x + "," + ((window.innerHeight / editor.state.grid.transform.k) + editor.state.grid.dimensions.x);
        })

        gridX.exit().remove();

        gridX = gridX.enter().append("path")
            // .attr("id", d => "x" + d * editor.state.grid.dimensions.x)
            .classed("line", true)
            .attr("d", function (d) {
                return "M" + d * editor.state.grid.dimensions.x + "," + (-editor.state.grid.dimensions.x) + "L" + d * editor.state.grid.dimensions.x + "," + ((window.innerHeight / editor.state.grid.transform.k) + editor.state.grid.dimensions.x);
            }).merge(gridX)

        thisGraph.gridX = gridX;

        // /** Grid */
        thisGraph.gridY = thisGraph.gridY.data(showGrid ? thisGraph.gridDataY : []);
        let gridY = thisGraph.gridY;

        gridY
            // .attr("id", d => "y" + ((d * editor.state.grid.dimensions.y) + editor.state.grid.transform.y))
            .attr("d", function (d) {
                return "M" + (-editor.state.grid.dimensions.y) + ","
                    + d * editor.state.grid.dimensions.y
                    + "L" + ((window.innerWidth / editor.state.grid.transform.k) + editor.state.grid.dimensions.y)
                    + "," + d * editor.state.grid.dimensions.y;
            })

        gridY.exit().remove();

        gridY = gridY.enter().append("path")
            .classed("line", true)
            // .attr("id", d => "y" + ((d * editor.state.grid.dimensions.y) + editor.state.grid.transform.y))
            .attr("d", function (d) {
                return "M" + (-editor.state.grid.dimensions.y) + ","
                    + d * editor.state.grid.dimensions.y
                    + "L" + ((window.innerWidth / editor.state.grid.transform.k) + editor.state.grid.dimensions.y)
                    + "," + d * editor.state.grid.dimensions.y;
            }).merge(gridY)

        thisGraph.gridY = gridY;

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

        thisGraph.paths = thisGraph.paths.data(thisGraph.editor.graph.edges, function (d) {
            return String(d.source.id) + "+" + String(d.target.id);
        });
        let paths = thisGraph.paths;
        // update existing paths
        paths.style('marker-end', 'url(#end-arrow)')
            .style('marker-start', function (d) { return !d.oneway ? 'url(#start-arrow)' : ''; })
            // .classed(consts.selectedClass, function (d) {
            //     return d === state.selectedEdge;
            // })
            // .attr("d", line([d.source.x, d.source.y, d.target.x, d.target.y]));
            .attr("d", function (d) {
                return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
            });

        // remove old links
        paths.exit().remove();

        // add new paths
        paths = paths.enter()
            .append("path")
            .style('marker-end', 'url(#end-arrow)')
            .style('marker-start', function (d) { return !d.oneway ? 'url(#start-arrow)' : ''; })
            .classed("edge", true)
            .attr("id", function (d) { return d.source.id + "<>" + d.target.id })
            .attr("d", function (d) {
                return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
            })
            .merge(paths)
            .on("click", function (event, d) {
                event.stopImmediatePropagation();
                thisGraph.pathMouseDown.call(thisGraph, d3.select(this), event, d);
            })

        thisGraph.paths = paths;

        ///////////////////////////////////////////

        thisGraph.pathLabels = thisGraph.pathLabels.data(thisGraph.editor.graph.edges, function (d) {
            return String(d.source.id) + "+" + String(d.target.id);
        });
        let pathLabels = thisGraph.pathLabels;
        // update existing paths
        pathLabels
            .attr("x", function (d) { return ((d.source.x + d.target.x) / 2); })
            .attr("y", function (d) { return ((d.source.y + d.target.y) / 2); })
            .text(function (d) {
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
            .attr("transform", function (d) {
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
            .attr("x", function (d) { return ((d.source.x + d.target.x) / 2); })
            .attr("y", function (d) { return ((d.source.y + d.target.y) / 2); })
            .text(function (d) {
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
            .attr("transform", function (d) {
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
        thisGraph.circles = thisGraph.circles.data(thisGraph.editor.graph.nodes, function (d) {
            return d.id;
        });

        // remove old nodes
        thisGraph.circles.exit().remove();

        thisGraph.circles.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        // add new nodes
        let newNodes = thisGraph.circles.enter()
            .append("g").merge(thisGraph.circles);

        newNodes.classed(consts.circleGClass, true)
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .attr("id", function (d) { return d.id })
            .on("mouseover", function (event, d) {
                state.mouseEnterNode = d;
                if (state.shiftNodeDrag) {
                    d3.select(this).classed(consts.connectClass, true);
                }
            })
            .on("mouseout", function (d) {
                state.mouseEnterNode = null;
                d3.select(this).classed(consts.connectClass, false);
            })
            .on("mousedown", function (event, d) {
                thisGraph.circleMouseDown.call(thisGraph, d3.select(this), event, d);
            })
            .on("click", function (event, d) {
                event.stopImmediatePropagation();
                thisGraph.circleMouseUp.call(thisGraph, d3.select(this), event, d);
            })
            .call(thisGraph.drag);

        thisGraph.circles = newNodes;

        // Add Circles on Node to make visible
        thisGraph.circles.each(function (d) {
            if (this.childNodes.length === 0) {
                d3.select(this)
                    .append("circle")
                    .attr("r", String(consts.nodeRadius));
            }
        });


        //////////////////////////////////////////

        thisGraph.nodeLabels = thisGraph.nodeLabels.data(thisGraph.editor.graph.nodes, function (d) {
            return String(d.id);
        });
        let nodeLabels = thisGraph.nodeLabels;
        // update existing 
        nodeLabels
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .text((d) => d[thisGraph.editor.config.getKey('settings/nodetext')])

        // remove old
        nodeLabels.exit().remove();

        // add new 
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

    }
    zoomed(event) {

        this.editor.state.justScaleTransGraph = true;
        // d3.select( "." + this.consts.graphClass)
        //     .attr("transform", event.transform);

        d3.select("." + this.consts.graphClass)
            .attr("transform", event.transform);

        editor.state.grid.transform = event.transform;

        d3.select(".grid").attr("transform",
            "translate(" + event.transform.x % (this.editor.state.grid.dimensions.x * event.transform.k)
            + "," + event.transform.y % (this.editor.state.grid.dimensions.y * event.transform.k)
            + ")scale(" + event.transform.k + ")");

        this.gridDataX = d3.range(0, ((window.innerWidth / event.transform.k) / this.editor.state.grid.dimensions.x) + 1);
        this.gridDataY = d3.range(0, ((window.innerHeight / event.transform.k) / this.editor.state.grid.dimensions.y) + 1);

        this.updateGraph();
        // calculate new grid

    }
    updateWindow(svg) {
        let docEl = document.documentElement,
            bodyEl = document.getElementsByTagName('body')[0];

        let x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
        let y = window.innerHeight || docEl.clientHeight || bodyEl.clientHeight;
        svg.attr("width", x).attr("height", y);
    }

}

