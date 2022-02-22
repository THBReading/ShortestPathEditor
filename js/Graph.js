class Graph {
    /**
     * @param {boolean} isDirected
     */
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.adjacency = {};
    }

    example() {
        this.nodes = [
            { title: "0", id: 0, order: 0, x: 100, y: 100 },
            { title: "1", id: 1, order: 1, x: 100, y: 300 },
        ];
        this.edges = [
            {
                source: this.nodes[1],
                target: this.nodes[0],
                oneway: false,
                weight: 200,
                // weight: Math.sqrt(
                // Math.pow(Math.abs(this.source.x - this.target.x), 2) +
                // Math.pow(Math.abs(this.source.y - this.target.y), 2))
            },
        ];
    }

    createAdjancency() {
        let graph = this;
        graph.adjacency = {};
        graph.edges.forEach((edge) => {
            let source = edge.source;
            let target = edge.target;
            let weight = Math.sqrt(
                Math.pow(Math.abs(source.x - target.x), 2) +
                Math.pow(Math.abs(source.y - target.y), 2)
            );
            graph.adjacency[source.id] = graph.adjacency[source.id] || {};
            this.adjacency[source.id][target.id] = weight;

            if (!edge.oneway) {
                graph.adjacency[target.id] = graph.adjacency[target.id] || {};
                graph.adjacency[target.id][source.id] = weight;
            }
        });
        // console.log(graph.adjacency);
    }
    resetGraph() {
        this.nodes = [];
        this.edges = [];

    }
    getLastNode() {
        if (this.nodes.length > 0) {
            return this.nodes.reduce((max, node) => (max.order > node.order) ? max : node);
        } else {
            return { order: -1 }
        }
    }

    createNode(node) {
        let nextId = node.nextId || this.getLastNode().order + 1 || 0;
        let d = { id: node.id, order: nextId, title: (nextId).toString(), x: node.x, y: node.y };
        this.nodes.push(d);
        return d;
    }

    createEdge(source, target, oneway) {
        let graph = this;


        let sourceLink = this.nodes.find(n => n.id === source.id);
        let targetLink = this.nodes.find(n => n.id === target.id);
        let weight = Math.sqrt(
            Math.pow(Math.abs(sourceLink.x - targetLink.x), 2) +
            Math.pow(Math.abs(sourceLink.y - targetLink.y), 2)
        );
        let newEdge = { source: sourceLink, target: targetLink, oneway: oneway, weight: weight };

        var foundIndex = graph.edges.findIndex((edge) => { return edge.source === newEdge.target && edge.target === newEdge.source });

        if (foundIndex === -1) {
            graph.edges.push(newEdge);
        } else {
            graph.edges[foundIndex].oneway = false;
        }
    }
    setNode(nodeId, nodeInfo) {
        let id = nodeId !== undefined ? nodeId : nodeInfo.id;
        var tempNode = this.nodes.find(n => n.id === id);
        if (tempNode) {
            tempNode.title = nodeInfo.title !== undefined ? nodeInfo.title : tempNode.title;
            tempNode.order = nodeInfo.order !== undefined ? nodeInfo.order : tempNode.order;
            tempNode.x = nodeInfo.x !== undefined ? nodeInfo.x : tempNode.x;
            tempNode.y = nodeInfo.y !== undefined ? nodeInfo.y : tempNode.y;
        } else {
            // create node
            //this.nodes.push(node);
        }
        return tempNode;
    }

    deleteAllNodeEdges(node) {
        // remove edges associated with a node
        let graph = this;
        let toSplice = graph.edges.filter(function (edge) {
            return (edge.source === node || edge.target === node);
        });
        toSplice.map(function (edge) {
            graph.removeEdge(edge)
        });

    }

    removeNode(node) {
        let graph = this;
        graph.nodes.splice(graph.nodes.indexOf(node), 1);
        this.deleteAllNodeEdges(node);
    }

    removeEdge(edge) {
        let graph = this;
        graph.edges.splice(graph.edges.indexOf(edge), 1);
    }




    findShortestPath(startNode, endNode) {
        // WHAT HAPPENS IF UNREACHABLE???
        let shortestDistanceNode = (distances, visited) => {
            // create a default value for shortest
            let shortest = null;

            // for each node in the distances object
            for (let node in distances) {
                // if no node has been assigned to shortest yet
                // or if the current node's distance is smaller than the current shortest
                let currentIsShortest =
                    shortest === null || distances[node] < distances[shortest];

                // and if the current node is in the unvisited set
                if (currentIsShortest && !visited.includes(node)) {
                    // update shortest to be the current node
                    shortest = node;
                }
            }
            return shortest;
        };

        let graph = this.adjacency;
        // track distances from the start node using a hash object
        let distances = {};
        distances[endNode] = "Infinity";
        distances = Object.assign(distances, graph[startNode]);
        // track paths using a hash object
        let parents = { endNode: null };
        for (let child in graph[startNode]) {
            parents[child] = startNode;
        }

        // collect visited nodes
        let visited = [];
        // find the nearest node
        let node = shortestDistanceNode(distances, visited);

        // for that node:
        while (node) {
            // find its distance from the start node & its child nodes
            let distance = distances[node];
            let children = graph[node];

            // for each of those child nodes:
            for (let child in children) {

                // make sure each child node is not the start node
                if (String(child) === String(startNode)) {
                    continue;
                } else {
                    // save the distance from the start node to the child node
                    let newdistance = distance + children[child];
                    // if there's no recorded distance from the start node to the child node in the distances object
                    // or if the recorded distance is shorter than the previously stored distance from the start node to the child node
                    if (!distances[child] || distances[child] > newdistance) {
                        // save the distance to the object
                        distances[child] = newdistance;
                        // record the path
                        parents[child] = node;
                    }
                }
            }
            // move the current node to the visited set
            visited.push(node);
            // move to the nearest neighbor node
            node = shortestDistanceNode(distances, visited);
        }

        // using the stored paths from start node to end node
        // record the shortest path
        let shortestPath = [endNode];
        let parent = parents[endNode];
        while (parent) {
            shortestPath.push(parent);
            parent = parents[parent];
        }
        shortestPath.reverse();

        //this is the shortest path
        // return the shortest path & the end node's distance from the start node
        let results = {};
        if (distances[endNode] == 'Infinity') {
            results = {
                distance: 'Error: No Path Found',
                path: [],
            };
        } else {
            results = {
                distance: distances[endNode],
                //path: [shortestPath],
                path: [startNode, ...shortestPath],
            };
        }
        return results;
    }

    findShortestPathsFromArray(idArray) {
        let fullPath = [],
            totalDistance = 0;
        for (let i = 0; i < idArray.length - 1; i++) {
            let result = this.findShortestPath(idArray[i], idArray[i + 1]);
            fullPath = [...fullPath, ...result.path];
            totalDistance += result.distance;
        }

        return {
            distance: totalDistance,
            path: fullPath
        }
    }

    /**
     * @return {string}
     */
    toString() {
        return Object.keys(this.nodes).toString();
    }

    toJSON() {
        return JSON.stringify({ nodes: this.nodes, edges: this.edges })
    }

    fromJSON(json) {
        this.resetGraph();
        let obj = JSON.parse(json);
        this.nodes = obj.nodes;
        obj.edges.forEach((edge) => this.createEdge(edge.source, edge.target, edge.oneway));
    }
}

export { Graph };