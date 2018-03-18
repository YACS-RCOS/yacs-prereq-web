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
	@ViewChild('graphCanvas') canvasRef: ElementRef;
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
	private colWidth : number = 195;

	//data structures handling graph nodes and links; defined below
	private node : any;
	private link : any;

	//2d list, where each list contains the order in which nodes appear in the column corresponding to the list #
	//note that when using a force directed graph, we ignore the node order as node re-positioning is allowed
	private columnList : any = [];

	//maintain the number of columns displayed by the graph
	private numColumns : number = 8;

	//how many pixels above each node should the title reside
	private nodeTitleOffset : number = 14;

	//canvas/context for rendering
	private cnv : any; 
	private ctx : any;
	
	//visual style 
	private bgColor : any = "rgba(255,255,255,1)";
	private columnColor : any = "rgba(200,200,200,1)";

	//framerate
	fps = 60;

	/**
	once ng is initialized, we setup our svg with the specified width and height constants
	**/
	ngOnInit() {
		//init canvas
		this.cnv = this.canvasRef.nativeElement;
		this.ctx = this.cnv.getContext("2d");
		this.cnv.width = this.svgWidth;
		this.cnv.height = this.svgHeight;
		
		//canvas render test
		this.ctx.fillStyle="rgba(255,50,50,1)";
		this.ctx.fillRect(0,0,this.svgWidth,this.svgHeight);

	}

	/**
	load in graph data from prereq file (hosted by data service)
	**/
	loadGraphData() {
		// let baseThis = this;
		// d3.json("http://localhost:3100/prereq/CSCI", function(prereqs) {
		// 	let nodeData = prereqs["CSCI_nodes"];
		// 	let metaNodeData = prereqs["meta_nodes"];

		// 	//first construct meta-nodes as standard nodes depend on their existence for edge creation
		// 	for (let metaNode of metaNodeData) {
		// 		let circle = baseThis.addNode(metaNode.meta_uid,metaNode.contains);
		// 	}

		// 	//construct graph nodes
		// 	for (let node of nodeData) {
		// 		let circle = baseThis.addNode(node.course_uid,null);

		// 		//construct edges based off of this node's prereqs and coreqs
		// 		let hasValidEdge = false;
		// 		for (let edge of node.prereq_formula) {
		// 			hasValidEdge = baseThis.addEdge(circle,baseThis.nodeDict[edge],"prereq") || hasValidEdge;
		// 		}
		// 		for (let edge of node.coreq_formula) {
		// 			baseThis.addEdge(circle,baseThis.nodeDict[edge],"coreq");
		// 		}
		// 		//start at column 0 if we have no prereqs or our prereqs are not in the dataset
		// 		if (node.prereq_formula.length == 0 || !hasValidEdge) {
		// 			baseThis.setColNum(circle,0);
		// 		}
		// 	}

		// 	//layout standard nodes and edges
		// 	baseThis.layoutColumns();
		// });
	}

	/**
	add a node to the graph, and store it in our nodeDict. Column defaults to -1 to indicate that it has not yet been placed
	@param id: the string id which corresponds to the newly added node
	@param containedNodeIDs: list of string ids corresponding to nodes to which this node branches
	@returns a reference to the newly constructed node in our nodeDict
	**/
	addNode(id:string, containedNodeIds:any) {
		// this.graph.nodes.push({"id" : id, "active" : true, "locked" : false});
		// this.nodeDict[id] = this.graph.nodes[this.graph.nodes.length - 1];
		// this.graph.nodes[this.graph.nodes.length-1].containedNodeIds = containedNodeIds;
		// this.graph.nodes[this.graph.nodes.length-1].column = -1;
		// return this.nodeDict[id];
	}

	/**
	locks the specified node, disallowing it from changing columns
	@param id: the string id of the node to hide
	**/
	lockNode(id:string) {
		// var curNode;
		// for (var i : number = 0; i < this.node._groups[0].length; ++i) {
		// 	curNode = this.node._groups[0][i];
		// 	var curTitle = curNode.childNodes[0].childNodes[0].data;
		// 	//make sure the ids are the same
		// 	if (curTitle == id) {
		// 		//found the node; now lock it
		// 		this.node._groups[0][i].locked = true;
		// 		return true;
		// 	}
		// }
		// //the desired node was not found
		// return false;
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
		// if (startNode && endNode) {
		// 	this.graph.links.push({"source" : startNode.id,"target" : endNode.id, 
		// 		"startNodeID" : startNode.id, "endNodeID" : endNode.id, "edgeType" : edgeType});

		// 	if (!this.edgeDict[startNode.id]) {
		// 		this.edgeDict[startNode.id] = [];
		// 	}
		// 	this.edgeDict[startNode.id].push(this.graph.links[this.graph.links.length-1]);
		// 	if (!this.edgeDict[endNode.id]) {
		// 		this.edgeDict[endNode.id] = [];
		// 	}
		// 	this.edgeDict[endNode.id].push(this.graph.links[this.graph.links.length-1]);
		// 	return true;
		// }
		// return false;
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
		this.loadGraphData();
	}

	redrawScreen() {
		console.log("atgergerf");
		this.drawSemesterColumns();
		/*for (var i : number = 0; i < this.nodes.length; ++i) {

		}*/
	}

	clearScreen() {
		this.ctx.fillStyle=this.bgColor;
		this.ctx.fillRect(0,0,this.svgWidth,this.svgHeight);
	}

	drawSemesterColumns() {
		for (var i : number = 0; i < this.numColumns; ++i) {
			let columnXMin = i*this.colWidth;
			this.ctx.fillStyle	= this.columnColor;
			this.ctx.fillRect(columnXMin + 20, 0, this.colWidth - 20, this.svgHeight);
		}

	}

	ngOnTick() {
		console.log("updating");
		this.redrawScreen();
	}
  
	/**
	graph update. Update node positions and constraints, followed by edge positions
	**/
	update() {
		this.redrawScreen();
	}

	//_intervalId = setInterval(this.update, 1000 / this.fps);
	//_intervalId = setInterval(function(){this.update();}, 1000 / this.fps);
}