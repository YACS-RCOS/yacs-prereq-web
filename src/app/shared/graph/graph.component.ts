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
	private nodeRadius : number = 10;

	//~edge visuals~
	private edgeStrokeWidth : number = 1.75;
	private edgeColor : any = "rgba(100,255,100,1)";
	private edgeHoverColor : any = "rgba(200,255,200,1)";

	//~node label visuals~
	private nodeLabelColor : any = "rgba(0,0,240,1)";
	private nodeLabelHoverColor : any = "rgba(60,60,255,1)";
	private nodeLabelFontSize : number = 12; 

	//~graph visuals~
	private bgColor : any = "rgba(255,255,255,1)";
	private graphWidth : number = 1580;
	private graphHeight : number = 600;

	//~column visuals~
	private columnBackgroundColor : any = "rgba(200,200,200,1)";
	private columnStrokeColor : any = "rgba(150,150,150,1)";
	private columnStrokeWidth : number = 1;
	private colHeight : number = this.graphHeight - 2;
	//width of column contained area
	private colWidth : number = 195;
	//width of space between columns (subtracted from colWidth)
	private colHalfSpace : number = 20;

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
	private mouseHeldRight : Boolean = false;
	private mouseClickedLeft : Boolean = false;
	private mouseClickedRight : Boolean = false;

	//forces definition
	private nodeAttractionForce : number = .95;
	private nodeRepelForce : number = 9;
	private nodeRepelMaxDist : number = 40;

	/**
	once ng is initialized, we setup our svg with the specified width and height constants
	**/
	ngOnInit() {
		//init canvas
		this.cnv = this.canvasRef.nativeElement;
		this.ctx = this.cnv.getContext("2d");
		this.cnv.width = this.graphWidth;
		this.cnv.height = this.graphHeight;
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
	add a node to the graph, and store it in our nodes. Column defaults to -1 to indicate that it has not yet been placed
	@param id: the string id which corresponds to the newly added node
	@param containedNodeIDs: list of string ids corresponding to nodes to which this node branches
	@returns a reference to the newly constructed node in our nodes
	**/
	addNode(id:string, containedNodeIds:any) {
		this.nodes[id] = {"id" : id, "active" : true, "locked" : false, "hidden":false, "containedNodeIds" : containedNodeIds, "column" : -1, "x":0,"y":Math.random()*this.graphHeight};
		return this.nodes[id];
	}

	/**
	locks the specified node, disallowing it from changing columns
	@param id: the string id of the node to hide
	**/
	lockNode(id:string) {
		this.nodes[id].locked = true;
	}

	/**
	hide the specified node, removing it from the graph and setting it to inactive
	@param id: the string id of the node to hide
	**/
	hideNode(id:string) {
		this.nodes[id].hidden = true;
	}

	/**
	add an edge to the graph, and store it in our edge dict. Edge gets placed as a connection from both its start node and its end node
	@param startNode: the initial node forming this edge
	@param endNode: the final node to which this edge connects
	@param edgeType: the string type of the newly constructed edge (currently defaulting to "prereq")
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
	@param node: the node from which to recursively layout the rest of our graph
	@param colNum: the column number of the current node
	@param allowOverride: whether or not we should allow column overriding while laying out nodes
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
	@param node: the node whose dependencies we wish to check
	@returns the largest column number of any of the specified node's dependency nodes
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
	@param node: the node which we wish to snap to the colum nearest to its position
	**/
	moveToNearestColumn(node : any) {
		//base case: if we release a node past the left side of the screen, return it to column 0
		if (node.x < 0) {
			node.column = 0;
		}
		else {
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
   			if (this.nodes.hasOwnProperty(key)) {
				let curNode : any = this.nodes[key];
				this.ctx.globalAlpha = curNode.hidden ? this.hiddenAlpha : 1;
				this.ctx.beginPath();
				this.ctx.arc(curNode.x,curNode.y,this.nodeRadius,0,2*Math.PI);
				this.ctx.strokeStyle = curNode.state == "hover" ? this.nodeStrokeHoverColor : this.nodeStrokeColor;
				this.ctx.fillStyle = curNode.state == "hover" ? this.nodeHoverColor : this.nodeColor;
				this.ctx.fill();
				this.ctx.stroke();
			}
		}

		//next draw edges
		this.ctx.lineWidth = this.edgeStrokeWidth;
		for (var key in this.edges) {
			if (this.edges.hasOwnProperty(key)) {
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
						this.ctx.stroke();
					}
				}
			}
		}


		//finally draw node titles
		this.ctx.font = this.nodeLabelFontSize + "px Arial";
		for(var key in this.nodes) { 
   			if (this.nodes.hasOwnProperty(key)) {
				let curNode : any = this.nodes[key];
				this.ctx.globalAlpha = curNode.hidden ? this.hiddenAlpha : 1;
				let labelWidth = this.ctx.measureText(curNode.id).width;
				this.ctx.fillStyle = curNode.state == "hover" ? this.nodeLabelHoverColor : this.nodeLabelColor;
				this.ctx.fillText(curNode.id,curNode.x - labelWidth/2,curNode.y - this.nodeRadius - this.nodeLabelFontSize/2);
			}
		}

		this.ctx.globalAlpha = 1;
	}

	/**
	draw columns specifying semester locations
	**/
	drawSemesterColumns() {
		for (var i : number = 0; i < this.numColumns; ++i) {
			let columnXMin = i*this.colWidth;
			this.roundRect(this.ctx,columnXMin + this.colHalfSpace, (this.graphHeight - this.colHeight)/2, this.colWidth - this.colHalfSpace*2, this.colHeight,
				this.columnBackgroundColor,this.columnStrokeColor, this.columnStrokeWidth, 20,true,true);
		}

	}

	/**
	update all node objects
	**/
	updateNodes() {
		//first pass: move dragged node
		for(var key in this.nodes) { 
   			if (this.nodes.hasOwnProperty(key)) {
				let curNode : any = this.nodes[key];
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
		}

		//second pass: move non-dragged nodes
		for(var key in this.nodes) { 
   			if (this.nodes.hasOwnProperty(key)) {
				let curNode : any = this.nodes[key];
				if (curNode.state == "drag") {
					continue;
				}

				//check if hovering
				if (this.ptInCircle(this.mousePos.x,this.mousePos.y,curNode.x,curNode.y,this.nodeRadius,true)) {
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
					else if (this.mouseClickedRight) {
						this.hideNode(curNode.id);
					}
				}

				let x1 = curNode.x;
				let y1 = curNode.y;
				for(var key2 in this.nodes) { 
   					if (this.nodes.hasOwnProperty(key2)) {
						let nextNode : any = this.nodes[key2];
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
						if (dist < 2*this.nodeRadius) {
							let newPos = this.applyForce(x2,y2,x1,y1,false,2*this.nodeRadius - dist);
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
				}
				curNode.x = x1;
				curNode.y = y1;
			}
		}

		//keep nodes within columns, unless they are being dragged
		for(var key in this.nodes) { 
   			if (this.nodes.hasOwnProperty(key)) {
				let curNode : any = this.nodes[key];
				if (curNode.state == "drag") {
					continue;
				}
				this.keepNodeInColumn(curNode);
			}
		}
	}

	/**
	keep the specified node within its column bounds
	@param {any} node: the node we wish to keep in its column bounds
	**/
	keepNodeInColumn(node) {
		//x bounds
		let colBounds = this.calculateColumnBounds(node.column);

		if (node.x - this.nodeRadius < colBounds.min) {
			node.x = colBounds.min + this.nodeRadius;
		}

		if (node.x + this.nodeRadius > colBounds.max) {
			node.x = colBounds.max - this.nodeRadius;
		}

		//y bounds
		if (node.y - this.nodeRadius < 0) {
			node.y = this.nodeRadius;
		}

		if (node.y + this.nodeRadius > this.graphHeight) {
			node.y = this.graphHeight - this.nodeRadius;
		}
	}


	/**
	calculate the horizontal bounds of the specified column number
	@param {number} colNum the column number whose bounds we wish to calculate
	@return an object containing the min and max x coordinates of the specified column
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
	@return a tuple containing the position of x1,y1 after force application
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
	@return the distance between points x1,y1 and x2,y2
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
	@return whether the specified point lies in the specified circle (true) or not (false)
	**/
	ptInCircle(px,py,cx,cy, cr, includeTouching) {
		if (includeTouching) {
			return this.ptDist(px,py,cx,cy) <= cr;	
		}
		return this.ptDist(px,py,cx,cy) < cr;
	}

	/**
	* get the angle between two points
	* @param x1: the x coordinate of the first point
	* @param y1: the y coordinate of the first point
	* @param x2: the x coordinate of the second point
	* @param y2: the y coordinate of the second point
	* @param radians: whether the angle is in radians (true) or degrees (false)
	* @returns the angle between the two input points
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
		this.redrawScreen();
		requestAnimationFrame(this.update.bind(this));
		//reset 1-frame mouse events
		this.mouseClickedLeft = false;
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
	 * @param evt: the currently processing event
	 * @param cnv: the canvas to check mouse position against
	 * @returns an object containing the x,y coordinates of the mouse
	 */
	getMouseDocument(evt,cnv) {
		var rect = cnv.getBoundingClientRect();
		return {x: evt.clientX - rect.left, y: evt.clientY - rect.top};	
	}

}