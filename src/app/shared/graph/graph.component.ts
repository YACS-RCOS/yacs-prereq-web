import {
	Component,
	OnInit,
	OnChanges,
	ViewChild,
	AfterViewInit,
	ElementRef,
	Input,
	ViewEncapsulation,
	HostListener
} from '@angular/core';
import * as d3 from 'd3';

@Component({
	selector: 'app-graph',
	templateUrl: 'graph.component.html',
	styleUrls: ['graph.component.scss']
})

export class GraphComponent implements OnInit {
	@Input() private data: Array < any > ;

	//grab references to our graph and canvas
	@ViewChild('graph') private graphContainer: ElementRef;
	@ViewChild('graphCanvas') canvasRef: ElementRef;
	@ViewChild('saveglyph') saveImgRef: ElementRef;
	@ViewChild('loadglyph') loadImgRef: ElementRef;

	//add mouse click and position event listeners to the document so we can interact with the graph
	@HostListener('document:mousemove', ['$event']) 
	onMouseMove(e) {
		this.mousePos = this.getMouseDocument(e,this.cnv);
	}
	@HostListener('document:mousedown', ['$event'])
	onMouseDown(e) {
		//left mouse button
		if (e.which == 1) {
			this.mouseClickedLeft = true;
			this.mouseHeldLeft = true;
		}

		//middle mouse button
		else if (e.which == 2) {
			this.mouseClickedMiddle = true;
			this.mouseHeldMiddle = true;
		}

		//right mouse button
		else if (e.which == 3) {
			this.mouseClickedRight = true;
			this.mouseHeldRight = true;
		}	
	}
	@HostListener('document:mouseup', ['$event'])
	onMouseUp(e) {
		if (e.which == 1) {
			this.mouseHeldLeft = false;
		}

		else if (e.which == 2) {
			this.mouseHeldMiddle = false;
		}

		else if (e.which == 3) {
			this.mouseHeldRight = false;
		}
	}
	//disable right-click context menu so we can repurpose the right mouse button
	@HostListener('document:contextmenu', ['$event'])
	onContextMenu(e) {
		return false;	
	}

	//visual style definition
	//~node visuals~
	private nodeColor : any = "rgba(255,100,100,1)";
	private nodeHoverColor : any = "rgba(255,125,125,1)";
	private nodeStrokeColor : any = "rgba(240,75,75,1)";
	private nodeStrokeWidth : number = 2;
	private nodeStrokeHoverColor : any = "rgba(250,90,90,1)";
	private nodeRadius : number = 20;

	//~edge visuals~
	private edgeStrokeWidth : number = 2.5;
	private edgeColor : any = "rgba(100,255,100,1)";
	private edgeHoverColor : any = "rgba(200,255,200,1)";

	//~node label visuals~
	private nodeLabelColor : any = "rgba(0,0,240,1)";
	private nodeLabelHoverColor : any = "rgba(60,60,255,1)";
	private nodeContainsColor : any = "rgba(255,255,255,1)";
	private nodeLabelFontSize : number = 18; 
	private nodeContainsFontSize : number = 12; 
	private nodeContainsPopupBackgroundColor : any = "rgba(0,0,0,1)";
	private nodeContainsPopupStrokeColor : any = "rgba(20,20,20,1)";
	private nodeContainsPopupStrokeWidth : number = 1;

	//~graph visuals~
	private bgColor : any = "rgba(255,255,255,1)";
	private graphWidth : number = 1580;
	private graphHeight : number = 600;

	//~toolbar visuals~
	private toolbarHeight : number = 30;
	private toolbarColor : any = "rgba(200,200,255,1)";
	private toolbarStrokeColor : any = "rgba(150,150,205,1)";
	private toolbarStrokeWidth : any = 1;

	//~column visuals~
	private columnBackgroundColor : any = "rgba(200,200,200,1)";
	private columnStrokeColor : any = "rgba(150,150,150,1)";
	private columnStrokeWidth : number = 1;
	//how many pixels above the top of the column should be reserved for spacing and to prevent node title clipping
	private colTopBuffer : number = 32;
	private colHeight : number = this.graphHeight - this.toolbarHeight - this.colTopBuffer;
	//width of column contained area
	private colWidth : number = 195;
	//width of space between columns (subtracted from colWidth)
	private colHalfSpace : number = 20;
	private colLabelColor : any = "rgba(130,130,130,1)";
	private colLabelFontSize : number = 24;

	//~misc visuals~
	private hiddenAlpha : number = .25;

	//data initialization
	//define our node and edge dicts as 'node id' : 'node' and 'node id' : 'edge list', respectively
	private nodes: any = {};
	private edges: any = {};
	//canvas/context for rendering
	private cnv : any; 
	private ctx : any;
	//2d list, where each list contains all nodes in the column whose number corresponds to that index
	private columnList : any = [];
	//maintain the number of columns displayed by the graph
	private numColumns : number = 8;
	//mouse state
	private mousePos : any = {x:-1,y:-1};
	private mouseHeldLeft : Boolean = false;
	private mouseHeldMiddle : Boolean = false;
	private mouseHeldRight : Boolean = false;
	private mouseClickedLeft : Boolean = false;
	private mouseClickedMiddle : Boolean = false;
	private mouseClickedRight : Boolean = false;
	//semester names
	private semesterNames : any = ["Fall 2018", "Spring 2019", "Fall 2019", "Spring 2020", "Fall 2020", "Spring 2021", "Fall 2021", "Spring 2022"];

	//forces definition
	private nodeAttractionForce : number = .95;
	private nodeRepelForce : number = 12;
	private nodeRepelMaxDist : number = 75;

	//buttons
	private buttons : any = [];

	/**
	once ng is initialized, we setup our svg with the specified width and height constants
	**/
	ngOnInit() {
		//init canvas
		this.cnv = this.canvasRef.nativeElement;
		this.ctx = this.cnv.getContext("2d");
		this.cnv.width = this.graphWidth;
		this.cnv.height = this.graphHeight;

		//init buttons
		this.buttons.push({'x':8,'y':4,'width':20,'height':20,'image':this.saveImgRef.nativeElement, 'state':"idle", 'function':this.saveGraph.bind(this)});
		this.buttons.push({'x':38,'y':4,'width':20,'height':20,'image':this.loadImgRef.nativeElement, 'state':"idle", 'function':this.loadGraph.bind(this)});
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
					hasValidEdge = baseThis.addEdge(circle,baseThis.nodes[edge],"prereq") || hasValidEdge;
				}
				for (let edge of node.coreq_formula) {
					baseThis.addEdge(circle,baseThis.nodes[edge],"coreq");
				}
				//start at column 0 if we have no prereqs or our prereqs are not in the dataset
				if (node.prereq_formula.length == 0 || !hasValidEdge) {
					baseThis.setColNum(circle,0);
				}
			}

			//layout standard nodes and edges
			baseThis.layoutColumns();
		});

		//begin the graph update loop
		this.update();
	}

	/**
	save the current state of the graph to HTML5 local storage
	**/
	saveGraph() {
		//console.log(this);
		localStorage.setItem("nodes", JSON.stringify(this.nodes));
		localStorage.setItem("edges", JSON.stringify(this.edges));
	}

	/**
	load the state of the graph from HTML5 local storage
	**/
	loadGraph() {
		let loadedNodes = localStorage.getItem("nodes");
		if (loadedNodes != undefined && loadedNodes != "null") {
			this.nodes = JSON.parse(loadedNodes);
			this.edges = JSON.parse(localStorage.getItem("edges"));
		}
	}

	/**
	add a node to the graph, and store it in our nodes. Column defaults to -1 to indicate that it has not yet been placed
	@param {string} id the string id which corresponds to the newly added node
	@param {any} containedNodeIDs list of string ids corresponding to nodes to which this node branches
	@return {any} a reference to the newly constructed node in our nodes
	**/
	addNode(id:string, containedNodeIds:any) {
		this.nodes[id] = {"id" : id, "active" : true, "locked" : false, "hidden":false, "containedNodeIds" : containedNodeIds, "column" : -1, "x":0,"y":Math.random()*this.graphHeight};
		return this.nodes[id];
	}

	/**
	locks the specified node, disallowing it from changing columns
	@param {string} id the string id of the node to hide
	**/
	lockNode(id:string) {
		this.nodes[id].locked = !this.nodes[id].locked;
	}

	/**
	hide the specified node, removing it from the graph and setting it to inactive
	@param {string} id the string id of the node to hide
	**/
	hideNode(id:string) {
		this.nodes[id].hidden = !this.nodes[id].hidden;
	}

	/**
	add an edge to the graph, and store it in our edge dict. Edge gets placed as a connection from both its start node and its end node
	@param {any} startNode the initial node forming this edge
	@param {any} endNode the final node to which this edge connects
	@param {any} edgeType the string type of the newly constructed edge (currently defaulting to "prereq")
	**/
	addEdge(startNode:any, endNode:any, edgeType:string) {
		if (startNode && endNode) {
			let newEdge = {"startNodeID" : startNode.id, "endNodeID" : endNode.id, "edgeType" : edgeType};

			if (!this.edges[startNode.id]) {
				this.edges[startNode.id] = [];
			}
			this.edges[startNode.id].push(newEdge);
			if (!this.edges[endNode.id]) {
				this.edges[endNode.id] = [];
			}
			this.edges[endNode.id].push(newEdge);
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
		for (let key in this.nodes) {
			let curNode = this.nodes[key];
			if (curNode.containedNodeIds != null) {
				let farthestColumn = 0;
				for (let i = 0; i < curNode.containedNodeIds.length; ++i) {
					let curContainedNode = this.nodes[curNode.containedNodeIds[i]];
					farthestColumn = Math.max(farthestColumn,curContainedNode? +curContainedNode.column : 0);
				}
				this.layoutFromNode(curNode,farthestColumn);
			}
			else if (+curNode.id[5] >= 4) {
				if (this.edges[curNode.id] == undefined || this.edges[curNode.id].length == 0) {
					this.setColNum(curNode,this.columnList.length-1,true);
				}
			}
		}
	}

	/**
	layout nodes stemming from current node
	@param {any} node the node from which to recursively layout the rest of our graph
	@param {number} colNum the column number of the current node
	@param {Boolean} allowOverride whether or not we should allow column overriding while laying out nodes
	**/
	layoutFromNode(node : any, colNum : number, allowOverride : boolean = false) {
		if (node.column != colNum) {
			this.setColNum(node,colNum, allowOverride);
		}
		if (this.edges[node.id]) {
			for (let edge of this.edges[node.id]) {
				if (edge.endNodeID == node.id) {
					//only re-layout a node if we are its greatest column dependency, unless we are not allowing overrides in the first place
					if ((!allowOverride) || !(this.nodeLargestColumnDependency(this.nodes[edge.startNodeID]) > node.column)) {
						this.layoutFromNode(this.nodes[edge.startNodeID],colNum+1,allowOverride);
					}
				}
			}	
		}		
	}

	/**
	find the largest column number contained by any of the specified node's dependencies
	@param {any} node the node whose dependencies we wish to check
	@return {number} the largest column number of any of the specified node's dependency nodes
	*/
	nodeLargestColumnDependency(node : any) {
		var maxCol = 0;
		for (let edge of this.edges[node.id]) {
			if (edge.startNodeID == node.id) {
				if (this.nodes[edge.endNodeID].column > maxCol) {
					maxCol = this.nodes[edge.endNodeID].column;
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
		//disallow moving to a nonexistent column
		if (colNum < 0) {
			colNum = 0;
		}
		else if (colNum >= this.numColumns) {
			colNum = this.numColumns - 1;
		}

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
	@param {any} node the node which we wish to snap to the colum nearest to its position
	**/
	moveToNearestColumn(node : any) {
		//ignore locked nodes
		if (node.locked) {
			return;
		}
		//base case: if we release a node past the left side of the screen, return it to column 0
		if (node.x < 0) {
			node.x = 0;
		}
		let colNum = -1;
		let colBounds = null;
		while (colBounds == null || node.x > colBounds.min - this.colHalfSpace) {
			colBounds = this.calculateColumnBounds(++colNum);
		}
		var desiredColumn = colNum-1;
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
		this.clearScreen();
		this.drawSemesterColumns();
		this.drawNodes();
		this.drawToolbar();
		this.drawButtons();
	}

	/**
	draw UI buttons
	**/
	drawButtons() {
		for (let i : number = 0; i < this.buttons.length; ++i) {
			this.ctx.globalAlpha = this.buttons[i].state == "hover" ? 1 : .6;
			this.ctx.drawImage(this.buttons[i].image, this.buttons[i].x,this.buttons[i].y,this.buttons[i].width,this.buttons[i].height,);
		}
		this.ctx.globalAlpha = 1;
	}

	/**
	draw the toolbar
	**/
	drawToolbar() {
		this.ctx.fillStyle = "rgba(0,0,255,1)";
		this.roundRect(this.ctx,this.toolbarStrokeWidth/2,this.toolbarStrokeWidth/2,this.graphWidth-this.toolbarStrokeWidth,this.toolbarHeight-this.toolbarStrokeWidth,
			this.toolbarColor,this.toolbarStrokeColor,this.toolbarStrokeWidth,10,true,true);

	}

	/**
	clear the screen to the set background color
	**/
	clearScreen() {
		this.ctx.fillStyle=this.bgColor;
		this.ctx.fillRect(0,0,this.graphWidth,this.graphHeight);
	}

	/**
	draw all nodes
	**/
	drawNodes() {
		//first draw node bodies
		this.ctx.lineWidth = this.nodeStrokeWidth;
		for(var key in this.nodes) { 
			let curNode : any = this.nodes[key];
			this.ctx.globalAlpha = curNode.hidden ? this.hiddenAlpha : 1;
			this.ctx.beginPath();
			this.ctx.arc(curNode.x,curNode.y,this.nodeRadius,0,2*Math.PI);
			this.ctx.strokeStyle = curNode.state == "hover" ? this.nodeStrokeHoverColor : this.nodeStrokeColor;
			this.ctx.fillStyle = curNode.state == "hover" ? this.nodeHoverColor : this.nodeColor;
			this.ctx.fill();
			this.ctx.stroke();
		}

		//next draw edges
		this.ctx.lineWidth = this.edgeStrokeWidth;
		for (var key in this.edges) {
			let curEdge : any = this.edges[key];
			for (let i : number = 0; i < curEdge.length; ++i) {
				//only draw edges where we are the start node to avoid drawing all edges twice
				if (curEdge[i].startNodeID == key) {
					this.ctx.beginPath();
					this.ctx.moveTo(this.nodes[curEdge[i].startNodeID].x,this.nodes[curEdge[i].startNodeID].y);
					this.ctx.lineTo(this.nodes[curEdge[i].endNodeID].x,this.nodes[curEdge[i].endNodeID].y);
					this.ctx.strokeStyle = this.nodes[curEdge[i].startNodeID].state == "hover" || this.nodes[curEdge[i].endNodeID].state == "hover" ?
					this.edgeHoverColor : this.edgeColor;
					this.ctx.globalAlpha = this.nodes[curEdge[i].startNodeID].hidden || this.nodes[curEdge[i].endNodeID].hidden ? this.hiddenAlpha : 1;
					//draw ball sockets at each end of the edge
					//this.ctx.arc(this.nodes[curEdge[i].startNodeID].x,this.nodes[curEdge[i].startNodeID].y,3,0,2*Math.PI);
					//this.ctx.arc(this.nodes[curEdge[i].endNodeID].x,this.nodes[curEdge[i].endNodeID].y,3,0,2*Math.PI);
					this.ctx.stroke();
				}
			}
		}

		//draw node lock status
		for (var key in this.nodes) {
			let curNode = this.nodes[key];
			//draw a lock symbol if the node is locked
			if (curNode.locked) {
				this.ctx.globalAlpha = curNode.hidden ? this.hiddenAlpha : 1;
				this.ctx.strokeStyle = "rgba(25,25,25,1)";
				this.ctx.fillStyle = "rgba(25,25,25,1)";
				this.ctx.fillRect(curNode.x - this.nodeRadius/2,curNode.y - this.nodeRadius/2, 8,7);
				this.ctx.beginPath();
				this.ctx.arc(curNode.x - this.nodeRadius/2 + 4,curNode.y - this.nodeRadius/2,2.8,Math.PI,2*Math.PI);
				this.ctx.stroke();
			}
		}


		//draw node titles
		this.ctx.font = this.nodeLabelFontSize + "px Arial";
		for(var key in this.nodes) { 
			let curNode : any = this.nodes[key];
			this.ctx.globalAlpha = curNode.hidden ? this.hiddenAlpha : 1;
			let labelWidth = this.ctx.measureText(curNode.id).width;
			this.ctx.fillStyle = curNode.state == "hover" ? this.nodeLabelHoverColor : this.nodeLabelColor;
			this.ctx.fillText(curNode.id,curNode.x - labelWidth/2,curNode.y - this.nodeRadius - this.nodeLabelFontSize/2);
		
		}

		this.ctx.globalAlpha = .7;
		//draw contained nodes when hovering over META nodes
		for (var key in this.nodes) {
			let curNode : any = this.nodes[key];
			if (!curNode.hidden && curNode.state == "hover") {
				if (curNode.containedNodeIds != null) {
					//determine the width of the largest contained node id
					let largestWidth : number = -1;
					for (var i : number = 0; i < curNode.containedNodeIds.length; ++i) {
						largestWidth = Math.max(largestWidth,this.ctx.measureText(curNode.id).width);
					}

					//draw a popup box to house the contained nodes text
					this.roundRect(this.ctx,curNode.x + this.nodeRadius - this.nodeContainsFontSize/4,curNode.y - this.nodeRadius - this.nodeContainsFontSize/4,
						largestWidth + this.nodeContainsFontSize/2, this.nodeContainsFontSize * (curNode.containedNodeIds.length + 1), 
						this.nodeContainsPopupBackgroundColor,this.nodeContainsPopupStrokeColor, this.nodeContainsPopupStrokeWidth, 8,true,true);

					//draw a triangle indicator extending out from the popup box
					this.ctx.beginPath();
				    this.ctx.moveTo(curNode.x + this.nodeRadius - this.nodeContainsFontSize/4 - 10, curNode.y);
				    this.ctx.lineTo(curNode.x + this.nodeRadius - this.nodeContainsFontSize/4, curNode.y - 5);
				    this.ctx.lineTo(curNode.x + this.nodeRadius - this.nodeContainsFontSize/4, curNode.y + 5);
				    this.ctx.fill();

					//now draw the contained nodes
					this.ctx.font = this.nodeContainsFontSize + "px Arial";
					this.ctx.fillStyle = this.nodeContainsColor;
					for (var i : number = 0; i < curNode.containedNodeIds.length; ++i) {
						this.ctx.fillText(curNode.containedNodeIds[i],curNode.x + this.nodeRadius,curNode.y - this.nodeRadius + this.nodeContainsFontSize * (i+1));
					}
				}
			}
		}

		//reset global alpha after node rendering so as not to affect other components
		this.ctx.globalAlpha = 1;
	}

	/**
	draw columns specifying semester locations
	**/
	drawSemesterColumns() {
		for (var i : number = 0; i < this.numColumns; ++i) {
			//draw column rect
			let columnXMin = i*this.colWidth;
			this.roundRect(this.ctx,columnXMin + this.colHalfSpace + this.columnStrokeWidth/2, this.toolbarHeight + this.colTopBuffer + this.columnStrokeWidth/2,
			 this.colWidth - this.colHalfSpace*2 - this.columnStrokeWidth, this.colHeight - this.columnStrokeWidth, 
			 this.columnBackgroundColor,this.columnStrokeColor, this.columnStrokeWidth, 20,true,true);

			//draw column title
			this.ctx.font = this.colLabelFontSize + "px Arial";
			let labelWidth = this.ctx.measureText(this.semesterNames[i]).width;
			this.ctx.fillStyle = this.colLabelColor;
			this.ctx.fillText(this.semesterNames[i],columnXMin + this.colHalfSpace + (this.colWidth - this.colHalfSpace*2)/2 - labelWidth/2,
				this.toolbarHeight + this.colTopBuffer + this.colLabelFontSize);
		}

	}

	/**
	update all UI buttons
	**/
	updateButtons() {
		for (let i : number = 0; i < this.buttons.length; ++i) {
			if (this.mouseOverButton(this.buttons[i])) {
				this.buttons[i].state = "hover";
				if (this.mouseClickedLeft) {
					this.buttons[i].function();
				}
			}
			else {
				this.buttons[i].state = "idle";
			}
		}
	}

	/**
	check if the mouse is hovering over the specified buttons
	@param {any} button the button to check against the mouse position
	@return {Boolean} whether the mouse is hovering over the specified button (true) or not (false)
	**/
	mouseOverButton(button : any) {
		return this.mousePos.x >= button.x && this.mousePos.x <= button.x + button.width
		&& this.mousePos.y >= button.y && this.mousePos.y <= button.y + button.height;
	}

	/**
	update all node objects
	**/
	updateNodes() {
		//first pass: move dragged node
		for(var key in this.nodes) { 
			let curNode : any = this.nodes[key];
			//don't interact with hidden nodes
			if (curNode.hidden) {
				continue;
			}
			if (curNode.state == "drag") {
				if (!this.mouseHeldLeft) {
					curNode.state = "idle";

					//we just released this node; place it in the nearest column
					this.moveToNearestColumn(curNode);

				}
				else {
					//move to mouse
					curNode.x = this.mousePos.x;
					curNode.y = this.mousePos.y;
				}
				break;
			}
		}

		//second pass: move non-dragged nodes
		for(var key in this.nodes) { 
			let curNode : any = this.nodes[key];
			//don't interact with hidden nodes
			if (curNode.hidden) {
				continue;
			}
			if (curNode.state == "drag") {
				continue;
			}

			//check if hovering
			if (this.ptInCircle(this.mousePos.x,this.mousePos.y,curNode.x,curNode.y,this.nodeRadius + this.nodeStrokeWidth/2,true)) {
				curNode.state = "hover";
			}
			else {
				curNode.state = "idle";
			}

			//check if should begin dragging
			if (curNode.state == "hover") {
				if (this.mouseClickedLeft) {
					curNode.state = "drag";
				}
				else if (this.mouseClickedMiddle) {
					this.hideNode(curNode.id);
					curNode.state = "idle";
				}
				else if (this.mouseClickedRight) {
					this.lockNode(curNode.id);
				}
			}

			let x1 = curNode.x;
			let y1 = curNode.y;
			for(var key2 in this.nodes) { 
				let nextNode : any = this.nodes[key2];
				//don't interact with hidden nodes
				if (nextNode.hidden) {
					continue;
				}
				//don't affect self
				if (curNode == nextNode) {
					continue;
				}

				//don't attract across columns
				if (curNode.column != nextNode.column) {
					continue;
				}
				let x2 = nextNode.x;
				let y2 = nextNode.y;
				let dist = this.ptDist(x1,y1,x2,y2);

				//first bump out any collisions
				if (dist < 2*this.nodeRadius+this.nodeStrokeWidth) {
					let newPos = this.applyForce(x2,y2,x1,y1,false,2*this.nodeRadius+this.nodeStrokeWidth - dist);
					x2 = newPos[0];
					y2 = newPos[1];
					nextNode.x = x2;
					nextNode.y = y2;
				}
				dist = this.ptDist(x1,y1,x2,y2);

				//next attract
				let newPos = this.applyForce(x1,y1,x2,y2, true, this.nodeAttractionForce * 100/dist);
				x1 = newPos[0];
				y1 = newPos[1];

				dist = this.ptDist(x1,y1,x2,y2);
				if (dist < this.nodeRepelMaxDist) {
					//we are withing range of node r, so repel
					let newPos = this.applyForce(x1,y1,x2,y2, false, this.nodeRepelForce * ((this.nodeRepelMaxDist - dist) / this.nodeRepelMaxDist));
					x1 = newPos[0];
					y1 = newPos[1];
				}
			}
			curNode.x = x1;
			curNode.y = y1;
			
		}

		//keep nodes within columns, unless they are being dragged
	for(var key in this.nodes) { 
			let curNode : any = this.nodes[key];
			if (curNode.state == "drag") {
				continue;
			}
			this.keepNodeInColumn(curNode);
		}
	}

	/**
	keep the specified node within its column bounds
	@param {any} node the node we wish to keep in its column bounds
	**/
	keepNodeInColumn(node) {
		//x bounds
		let colBounds = this.calculateColumnBounds(node.column);

		if (node.x - this.nodeRadius-this.nodeStrokeWidth/2 < colBounds.min) {
			node.x = colBounds.min + this.nodeRadius+this.nodeStrokeWidth/2;
		}

		if (node.x + this.nodeRadius+this.nodeStrokeWidth/2 > colBounds.max) {
			node.x = colBounds.max - this.nodeRadius-this.nodeStrokeWidth/2;
		}

		//y bounds
		let yMin = this.toolbarHeight + this.colTopBuffer;
		let yMax = yMin + this.colHeight;
		if (node.y - this.nodeRadius-this.nodeStrokeWidth/2 < yMin) {
			node.y = yMin + this.nodeRadius+this.nodeStrokeWidth/2;
		}

		if (node.y + this.nodeRadius+this.nodeStrokeWidth/2 > yMax) {
			node.y = yMax - this.nodeRadius-this.nodeStrokeWidth/2;
		}
	}


	/**
	calculate the horizontal bounds of the specified column number
	@param {number} colNum the column number whose bounds we wish to calculate
	@return {any} an object containing the min and max x coordinates of the specified column
	**/ 
	calculateColumnBounds(colNum) {
		let colXMin = colNum*this.colWidth + this.colHalfSpace;
		let colXMax = colXMin + this.colWidth - 2 * this.colHalfSpace;
		return {"min":colXMin,"max":colXMax};
	}

	/**
	apply a force to position x1,y1 from direction of x2,y2 given strength
	@param {number} x1 the first x coordinate
	@param {number} y1 the first y coordinate
	@param {number} x2 the second x coordinate
	@param {number} y2 the second y coordinate
	@param {Boolean} isAttraction whether the force is an attraction force (true) or a repulsion force (false)
	@param {number} strength how strong the force to apply is
	@return {any} a tuple containing the position of x1,y1 after force application
	**/
	applyForce(x1,y1,x2,y2,isAttraction,strength) {
		let ang = this.ptAngle(x1,y1,x2,y2,true);
		return[x1 + Math.cos(ang) * (isAttraction ? strength : -strength), y1 + Math.sin(ang) * (isAttraction ? strength : -strength)];
	}

	/**
	calculate distance between specified points
	@param {number} x1 the first x coordinate
	@param {number} y1 the first y coordinate
	@param {number} x2 the second x coordinate
	@param {number} y2 the second y coordinate
	@return {number} the distance between points x1,y1 and x2,y2
	**/
	ptDist(x1,y1,x2,y2) {
		return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
	}

	/**
	check whether or not a point lies in a circle
	@param {number} px the x coordinate of the point
	@param {number} py the y coordinate of the point
	@param {number} cx the center x coordinate of the circle
	@param {number} cy the center y coordinate of the circle
	@param {number} cr the radius of the circle
	@param {Boolean} includeTouching whether or not the point should be considered in the circle if they are merely touching
	@return {Boolean} whether the specified point lies in the specified circle (true) or not (false)
	**/
	ptInCircle(px,py,cx,cy, cr, includeTouching) {
		if (includeTouching) {
			return this.ptDist(px,py,cx,cy) <= cr;	
		}
		return this.ptDist(px,py,cx,cy) < cr;
	}

	/**
	* get the angle between two points
	* @param {number} x1 the x coordinate of the first point
	* @param {number} y1 the y coordinate of the first point
	* @param {number} x2 the x coordinate of the second point
	* @param {number} y2 the y coordinate of the second point
	* @param {Boolean} radians whether the angle is in radians (true) or degrees (false)
	* @return {number} the angle between the two input points
	*/

 	ptAngle(x1,y1,x2,y2,radians) {
		if (radians == null || radians == false) {
			return Math.atan2((y2-y1),(x2-x1))*180/Math.PI;
		}
		return Math.atan2((y2-y1),(x2-x1));
	}

  
	/**
	graph update. Update node positions and constraints, followed by edge positions
	**/
	update() {
		this.updateNodes();
		this.updateButtons();
		this.redrawScreen();
		requestAnimationFrame(this.update.bind(this));
		//reset 1-frame mouse events
		this.mouseClickedLeft = false;
		this.mouseClickedMiddle = false;
		this.mouseClickedRight = false;
	}

	/**
	 * Draws a rounded rectangle using the current state of the canvas.
	 * If you omit the last three params, it will draw a rectangle
	 * outline with a 5 pixel border radius
	 * taken from: https://stackoverflow.com/a/3368118
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {Number} x The top left x coordinate
	 * @param {Number} y The top left y coordinate
	 * @param {Number} width The width of the rectangle
	 * @param {Number} height The height of the rectangle
	 * @param {Number} [radius = 5] The corner radius; It can also be an object 
	 *                 to specify different radii for corners
	 * @param {Number} [radius.tl = 0] Top left
	 * @param {Number} [radius.tr = 0] Top right
	 * @param {Number} [radius.br = 0] Bottom right
	 * @param {Number} [radius.bl = 0] Bottom left
	 * @param {Boolean} [fill = false] Whether to fill the rectangle.
	 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
	 **/
	 roundRect(ctx, x, y, width, height, fillColor, strokeColor, strokeWidth, radius, fill, stroke) {
	  if (typeof stroke == 'undefined') {
	    stroke = true;
	  }
	  if (typeof radius === 'undefined') {
	    radius = 5;
	  }
	  if (typeof radius === 'number') {
	    radius = {tl: radius, tr: radius, br: radius, bl: radius};
	  } else {
	    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
	    for (var side in defaultRadius) {
	      radius[side] = radius[side] || defaultRadius[side];
	    }
	  }
	  ctx.beginPath();
	  ctx.moveTo(x + radius.tl, y);
	  ctx.lineTo(x + width - radius.tr, y);
	  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	  ctx.lineTo(x + width, y + height - radius.br);
	  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	  ctx.lineTo(x + radius.bl, y + height);
	  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	  ctx.lineTo(x, y + radius.tl);
	  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
	  ctx.closePath();
	  if (fill) {
	  	ctx.fillStyle = fillColor;
	    ctx.fill();
	  }
	  if (stroke) {
	  	ctx.lineWidth = strokeWidth;
	  	ctx.strokeStyle = strokeColor;
	    ctx.stroke();
	  }
	  }

	  /**
	 * get the position of the mouse in the document
	 * @param {any} evt the currently processing event
	 * @param {any} cnv the canvas to check mouse position against
	 * @return {any} an object containing the x,y coordinates of the mouse
	 **/
	getMouseDocument(evt,cnv) {
		var rect = cnv.getBoundingClientRect();
		return {x: evt.clientX - rect.left, y: evt.clientY - rect.top};	
	}
}