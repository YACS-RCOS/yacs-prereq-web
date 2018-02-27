import {
	Component,
	OnInit,
	OnChanges,
	ViewChild,
	AfterViewInit,
	ElementRef,
	Input,
	ViewEncapsulation
} from '@angular/core';
import * as d3 from 'd3';

@Component({
	selector: 'app-graph',
	templateUrl: 'graph.component.html',
	styleUrls: ['graph.component.scss']
})

export class GraphComponent implements OnInit {
	@Input() private data: Array < any > ;
	@ViewChild('graph') private graphContainer: ElementRef;
	//dictionary of 'name' : 'node' for easy node access during graph construction
	private nodeDict: any = {};
	//dictionary of 'name' : 'list of connected edges' for easy edge access during graph construction
	private edgeDict: any = {};
	
	//constants defining node visuals
	private nodeRadius : number = 10;
	private nodeStrokeWidth : number = 2;

	//svg dimensions define the play area of our graph
	private svgWidth : number = 1580;
	private svgHeight : number = 600;

	//width of column contained area
	private colWidth : number = 200;

	//reference to graph base svg
	private svg : any;

	//our graph data structure consists of a list of nodes and a list of edges or 'links'
	private graph : any = {nodes:[],links:[]};
	
	//our graph color is inherited from the d3 visual stype
	private color : any;

	//data structures handling graph nodes and links; defined below
	private node : any;
	private link : any;

	//2d list, where each list contains the order in which nodes appear in the column corresponding to the list #
	//note that when using a force directed graph, we ignore the node order as node re-positioning is allowed
	private columnList : any = [];

	//our force directed simulation; we need this reference when udpating the simulation as a whole
	private forceGraph : any;

	//maintain the number of columns displayed by the graph
	private numColumns : number = 8;

	//how many pixels above each node should the title reside
	private nodeTitleOffset : number = 14;

	private cnv : any = document.createElement("canvas");
	private ctx : any = this.cnv.getContext("2d");
	private bgColor : any = "rgba(200,200,255,1)";

	/**
	once ng is initialized, we setup our svg with the specified width and height constants
	**/
	ngOnInit() {
		let baseThis = this;
		this.svg = d3.select(this.graphContainer.nativeElement).append('svg')
		        .attr("class", "panel")
		        .attr("width", baseThis.svgWidth)
		        .attr("height", baseThis.svgHeight);

		this.cnv.width = this.svgWidth;
		this.cnv.height = this.svgHeight;
		document.body.appendChild(this.cnv);
	}

	/**
	load in graph data from prereq file (hosted by data service)
	**/
	loadGraphData() {
		let baseThis = this;
		d3.json("http://localhost:3100/prereq/CSCI", function(prereqs) {
			let nodeData = prereqs["CSCI_nodes"];
			let metaNodeData = prereqs["meta_nodes"];

			//first construct meta-nodes as standard nodes depend on their existence for edge creation
			for (let metaNode of metaNodeData) {
				let circle = baseThis.addNode(metaNode.meta_uid,metaNode.contains);
			}

			//construct graph nodes
			for (let node of nodeData) {
				let circle = baseThis.addNode(node.course_uid,null);

				//construct edges based off of this node's prereqs and coreqs
				let hasValidEdge = false;
				for (let edge of node.prereq_formula) {
					hasValidEdge = baseThis.addEdge(circle,baseThis.nodeDict[edge],"prereq") || hasValidEdge;
				}
				for (let edge of node.coreq_formula) {
					baseThis.addEdge(circle,baseThis.nodeDict[edge],"coreq");
				}
				//start at column 0 if we have no prereqs or our prereqs are not in the dataset
				if (node.prereq_formula.length == 0 || !hasValidEdge) {
					baseThis.setColNum(circle,0);
				}
			}

			//layout standard nodes and edges
			baseThis.layoutColumns();

			//add the finalized graph
			baseThis.render(baseThis.graph);
		});
	}

	/**
	add a node to the graph, and store it in our nodeDict. Column defaults to -1 to indicate that it has not yet been placed
	@param id: the string id which corresponds to the newly added node
	@param containedNodeIDs: list of string ids corresponding to nodes to which this node branches
	@returns a reference to the newly constructed node in our nodeDict
	**/
	addNode(id:string, containedNodeIds:any) {
		this.graph.nodes.push({"id" : id, "active" : true, "locked" : false});
		this.nodeDict[id] = this.graph.nodes[this.graph.nodes.length - 1];
		this.graph.nodes[this.graph.nodes.length-1].containedNodeIds = containedNodeIds;
		this.graph.nodes[this.graph.nodes.length-1].column = -1;
		return this.nodeDict[id];
	}

	/**
	locks the specified node, disallowing it from changing columns
	@param id: the string id of the node to hide
	**/
	lockNode(id:string) {
		var curNode;
		for (var i : number = 0; i < this.node._groups[0].length; ++i) {
			curNode = this.node._groups[0][i];
			var curTitle = curNode.childNodes[0].childNodes[0].data;
			//make sure the ids are the same
			if (curTitle == id) {
				//found the node; now lock it
				this.node._groups[0][i].locked = true;
				return true;
			}
		}
		//the desired node was not found
		return false;
	}

	/**
	hide the specified node, removing it from the graph and setting it to inactive
	@param id: the string id of the node to hide
	**/
	hideNode(id:string) {
		console.log("***testing hideNode***");
		//first find and remove the desired node
		//delete(this.nodeDict[id]);
		//this.forceGraph.selectAll("node") = this.nodeDict;
		//this.forceGraph.nodes(this.nodeDict);
		//this.forceGraph.restart();
	}

	/**
	add an edge to the graph, and store it in our edge dict. Edge gets placed as a connection from both its start node and its end node
	@param startNode: the initial node forming this edge
	@param endNode: the final node to which this edge connects
	@param edgeType: the string type of the newly constructed edge (currently defaulting to "prereq")
	**/
	addEdge(startNode:any, endNode:any, edgeType:string) {
		if (startNode && endNode) {
			this.graph.links.push({"source" : startNode.id,"target" : endNode.id, 
				"startNodeID" : startNode.id, "endNodeID" : endNode.id, "edgeType" : edgeType});

			if (!this.edgeDict[startNode.id]) {
				this.edgeDict[startNode.id] = [];
			}
			this.edgeDict[startNode.id].push(this.graph.links[this.graph.links.length-1]);
			if (!this.edgeDict[endNode.id]) {
				this.edgeDict[endNode.id] = [];
			}
			this.edgeDict[endNode.id].push(this.graph.links[this.graph.links.length-1]);
			return true;
		}
		return false;
	}

	/**
	organize nodes into columns based on their prereqs
	**/
	layoutColumns() {
		//start by laying out nodes branching from first column (nodes with no dependencies)
		for (let node of this.columnList[0]) {
			this.layoutFromNode(node,0);	
		}

		//move meta nodes to the same column as their farthest contained node, and stick lone 4000+ level classes at the end
		for (let key in this.nodeDict) {
			let curNode = this.nodeDict[key];
			if (curNode.containedNodeIds != null) {
				let farthestColumn = 0;
				for (let i = 0; i < curNode.containedNodeIds.length; ++i) {
					let curContainedNode = this.nodeDict[curNode.containedNodeIds[i]];
					farthestColumn = Math.max(farthestColumn,curContainedNode? +curContainedNode.column : 0);
				}
				this.layoutFromNode(curNode,farthestColumn);
			}
			else if (+curNode.id[5] >= 4) {
				if (this.edgeDict[curNode.id] == undefined || this.edgeDict[curNode.id].length == 0) {
					this.setColNum(curNode,this.columnList.length-1,true);
				}
			}
		}
	}

	/**
	layout nodes stemming from current node
	@param node: the node from which to recursively layout the rest of our graph
	@param colNum: the column number of the current node
	@param allowOverride: whether or not we should allow column overriding while laying out nodes
	**/
	layoutFromNode(node : any, colNum : number, allowOverride : boolean = false) {
		if (node.column != colNum) {
			this.setColNum(node,colNum, allowOverride);
		}
		if (this.edgeDict[node.id]) {
			for (let edge of this.edgeDict[node.id]) {
				if (edge.endNodeID == node.id) {
					//only re-layout a node if we are its greatest column dependency, unless we are not allowing overrides in the first place
					if ((!allowOverride) || !(this.nodeLargestColumnDependency(this.nodeDict[edge.startNodeID]) > node.column)) {
						this.layoutFromNode(this.nodeDict[edge.startNodeID],colNum+1,allowOverride);
					}
				}
			}	
		}		
	}

	/**
	find the largest column number contained by any of the specified node's dependencies
	@param node: the node whose dependencies we wish to check
	@returns the largest column number of any of the specified node's dependency nodes
	*/
	nodeLargestColumnDependency(node : any) {
		var maxCol = 0;
		for (let edge of this.edgeDict[node.id]) {
			if (edge.startNodeID == node.id) {
				if (this.nodeDict[edge.endNodeID].column > maxCol) {
					maxCol = this.nodeDict[edge.endNodeID].column;
				}
			}
		}
		return maxCol;
	}

	/**
	move Node node to column colNum
	@param node: the node whose column number we wish to set
	@param colNum: the column number to set for the specified node
	@param allowColumnChange: whether we should set the node column if it has already been set (true) or leave it as is (false)
	**/
	setColNum(node : any, colNum: number, allowColumnChange = false) {
		//disallow moving a locked node
		if (node.locked) {
			return;
		}

		//disallow moving a node to its current column
		if (colNum == node.column) {
			return;
		}
		if (node.column == -1 || allowColumnChange) {
			//make sure we have enough columns
			while (this.columnList.length < (colNum+1)) {
				this.columnList.push([]);
			}
			if (node.column != -1) {
				//remove from current column
				let oldColumn = this.columnList[node.column];
				let oldIndex = oldColumn.indexOf(node);
				oldColumn.splice(oldIndex,1);
				//reposition displaced nodes
				for (let i = oldIndex; i <oldColumn.length; ++i) {
					this.columnList[node.column][i].column = node.column;
					
				}
			}
			
			//add to new column
			this.columnList[colNum].push(node);
			node.column = colNum;
		}
	}

	/**
	move node into the nearest column (to be called upon drag end)
	@param node: the node which we wish to snap to the colum nearest to its position
	**/
	moveToNearestColumn(node : any) {
		var desiredColumn = Math.floor((node.x+this.colWidth/4 - 30)/this.colWidth);
		var startColumn = node.column;
		//run the layouting process one column at a time as jumping multiple columns may cause nodes to be left behind
		while (startColumn != desiredColumn) {
			startColumn += (startColumn > desiredColumn ? -1 : 1);
			this.layoutFromNode(node,startColumn,true);
		}
	}
  
	/**
	once the view has been initialized, we are ready to begin setting up our graph and loading in data
	**/
	ngAfterViewInit() {
		let baseThis = this;
		this.svg = d3.select("svg");

		this.color = d3.scaleOrdinal(d3.schemeCategory20);

		this.forceGraph = d3.forceSimulation()
			.force("link", d3.forceLink().id(function (d:{ id: string}) {
		    return d.id
		  }))
		  
		  	//keep nodes from spreading too far
		    .force("attract", d3.forceManyBody().strength(.005).distanceMax(10000).distanceMin(60))
		    //keep nodes from sitting directly on top of each other
		    .force("repel", d3.forceManyBody().strength(-175).distanceMax(100).distanceMin(10))
		    //have nodes gravitate towards the canvas center
		    .force("center", d3.forceCenter(baseThis.svgWidth / 2, baseThis.svgHeight / 2));

		this.loadGraphData();
	}
  
	/**
	graph update. Update node positions and constraints, followed by edge positions
	**/
	ticked() {
		let baseThis = this;

		function getNodeX(d) {
			//keep x within column bounds and svg bounds, unless dragging
	    	//xBuffer determines how much padding we need to keep between the node and the edge of the column or svg
	    	let xBuffer = baseThis.nodeRadius+baseThis.nodeStrokeWidth;
	    	let columnXMin = d.dragging ? 0 : (+d.column)*baseThis.colWidth + 10;
	    	let columnXMax = d.dragging ? baseThis.svgWidth : (+d.column)*baseThis.colWidth + 90;
	    	return d.x = Math.max(xBuffer + columnXMin, Math.min(columnXMax - xBuffer, d.x)); 
		}

		function getNodeY(d) {
			return d.y = Math.max(baseThis.nodeRadius+baseThis.nodeStrokeWidth, 
		    	Math.min(baseThis.svgHeight - baseThis.nodeRadius - baseThis.nodeStrokeWidth, d.y)); 
		}

		this.node.selectAll("circle")
		    .attr("cx", getNodeX)
		    //keep y within svg bounds
		    .attr("cy", getNodeY);

		this.node.selectAll("text")
		    .attr("x", getNodeX)
		    .attr("y", function(d) {return getNodeY(d) - baseThis.nodeTitleOffset});

		//update links after nodes, in order to ensure that links do not lag behind node updates
		this.link
		    .attr("x1", function(d) { return d.source.x; })
		    .attr("y1", function(d) { return d.source.y; })
		    .attr("x2", function(d) { return d.target.x; })
		    .attr("y2", function(d) { return d.target.y; });
	}

	redrawScreen() {
		this.clearScreen();
	}

	clearScreen() {
		this.ctx.fillStyle="rgb(40,120,255)";
		this.ctx.fillRect(0,0,this.svgWidth,this.svgHeight);
	}
  
	/**
	adds the graph to the page. This is the last step to bring up our force directed graph
	@param graph: the graph element to add to the page
	**/
	render(graph : any) {
		let baseThis = this;

		this.redrawScreen();

		var columnLabels : any = ["Spring 2018", "Fall 2018", "Spring 2019", "Fall 2019", "Spring 2020", "Fall 2020", "Spring 2021", "Fall 2021"];
		//add column indicator rects and titles
		for (var i : number = 0; i < this.numColumns; ++i) {
			let columnXMin = (i)*baseThis.colWidth;
			this.svg.append("rect")
				.attr("x", columnXMin)
	           	.attr("y", 0)
	          	.attr("width", this.colWidth - 20)                          
	           	.attr("height", this.svgHeight)
				.attr("fill", "rgba(20,20,80,.3");
			this.svg.append("text")
				.attr("x", columnXMin + 22)
				.attr("y", 26)
				.attr("font-size", "24px")
				.attr("fill", "rgba(40,40,200)")
				.style("pointer-events", "none")
				.text(columnLabels[i]);
		}

		//add edges
		this.link = this.svg.append("g")
			.attr("class", "links")
			.selectAll("line")
			.data(graph.links)
			.enter().append("line")
				.attr("stroke-width", 2)
				.attr("stroke","#8b2c2c");

		//add nodes
		this.node = this.svg.append("g")
			.attr("class", "nodes")
			.selectAll("circle")
			.data(graph.nodes)
			.enter().append("g")

		this.node.append("circle")
			.attr("r", baseThis.nodeRadius)
				.attr("fill", "#877979")
				.attr("stroke","#362121")
				.attr("stroke-width",baseThis.nodeStrokeWidth)
				.call(d3.drag()
			    	.on("start", (d)=>{return this.dragstarted(d)})
			    	.on("drag", (d)=>{return this.dragged(d)})
			    	.on("end", (d)=>{return this.dragended(d)}));

		this.node.append("text")
	        .style("text-anchor", "middle")
	        .style("fill", "#555")
	        .style("font-family", "Arial")
	        .style("font-size", 18)
	        .style("pointer-events", "none")
	        .text(function (d) { return d.id; });

		this.forceGraph
			.nodes(graph.nodes)
		 	.on("tick", ()=>{return this.ticked()});

		this.forceGraph.force("link")
			.links(graph.links);  
	}

	/**
	drag update
	@param d: the node being dragged
	**/
	dragged(d) {
		//don't allow dragging on inactive nodes
		if (!d.active) {
			return;
		}
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	/**
	finished dragging; snap to the nearest column
	@param d: the node that we just finished dragging
	**/
	dragended(d) {
		//don't allow dragging on inactive nodes
		if (!d.active) {
			return;
		}
		if (!d3.event.active) {
			this.forceGraph.alphaTarget(0);
		}
		d.fx = null;
		d.fy = null;
		d.dragging = false;
		this.moveToNearestColumn(d);
	}

	/**
	started dragging; mark the drag node as being dragged
	@param d: the node that we just started dragging
	**/
	dragstarted(d) {
		//don't allow dragging on inactive nodes
		if (!d.active) {
			console.log("ERROR: attempted to drag an inactive node!")
			return;
		}
		if (!d3.event.active) {
			this.forceGraph.alphaTarget(0.3).restart();
		}
		d.fx = d.x;
		d.fy = d.y;
		d.dragging = true;

		/**TEST CODE: test hideNode functionality**/
		this.hideNode("CSCI-4210");
		/**TEST CODE: test lockNode functionality**/
		//this.lockNode("CSCI-4210");
	}
}