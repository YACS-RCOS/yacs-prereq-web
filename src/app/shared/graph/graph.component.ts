import {
	Component,
	OnInit,
	OnChanges,
	ViewChild,
	ElementRef,
	Input,
	ViewEncapsulation
} from '@angular/core';
import * as d3 from 'd3';

@Component({
	selector: 'app-graph',
	templateUrl: './graph.component.html',
	styleUrls: ['./graph.component.css']
})

export class GraphComponent implements OnInit {

	@Input() private data: Array < any > ;
	@ViewChild('graph') private graphContainer: ElementRef;
	//private margin: any = { top: 20, bottom: 20, left: 20, right: 20};
	private graph: any;
	private nodeRadius: number;
	private userCanEdit: boolean;
	private colors: any;
	private strokeThickness: number;
	private edgeThickness: number;
	private nodeSpacing: number;
	private nodeDict: any;
	private edgeDict: any;

	//mouse drag vars
	private startCoords: [number,number];
	private dragging: boolean = false;
	private dragNode: any;

	constructor() {

	}

	ngOnInit() {
		this.createGraph();
		if (this.data) {
			this.updateGraph();
		}
	}

	ngOnChanges() {
		if (this.graph) {
			this.updateGraph();
		}
	}

	createGraph() {
		var width = window.innerWidth;
		var height = window.innerHeight;

		let element = this.graphContainer.nativeElement;
		this.graph = d3.select(element).append('svg')
			.attr('width', width)
			.attr('height', height);

		// init constants
		this.nodeRadius = 40;
		this.userCanEdit = false;
		this.strokeThickness = 2;
		this.edgeThickness = 4;
		this.nodeSpacing = 24;

		var curX: number = width / 2;
		var curY: number = height / 2;

		//hard-code nodes and edges until we reimplement loading prereqs from JSON
		type edge = {startNode: string, endNode: string}
		var nodeNames: string[] = ["1100", "1200"]
		let edges : edge[] = []
		edges.push({startNode:"1100",endNode:"1200"})
		
		//dictionary of 'name' : 'svg parent' for easy node access
		this.nodeDict = {};
		//dictionary of 'startNodeName' : 'svg parent' and 'endNodeName' : 'svg parent' for easy edge access
		this.edgeDict = {};

		//maintain a reference to this in case we need to access it while inside a selection
		var baseThis = this;

		//construct edge and node group parents
		var edgeParent = this.graph.append("g").attr("id","edges");
		var nodeParent = this.graph.append("g").attr("id","nodes");

		//setup mouse events on graph
		this.graph.on("mousedown", function() {
			//poll for closest node on mouseDown
			baseThis.startCoords = d3.mouse(this);
			var closestNode = null;
			var closestDistance = -1;
			for (var nodeKey in baseThis.nodeDict) {
				var curCircle = baseThis.nodeDict[nodeKey];
				var curDistance = Math.sqrt(
					Math.pow(+curCircle.attr("x") + +curCircle.attr("width") / 2 - baseThis.startCoords[0], 2) +
					Math.pow(+curCircle.attr("y") + +curCircle.attr("height") / 2 - baseThis.startCoords[1], 2));
				if (closestDistance == -1 || curDistance < closestDistance) {
					closestDistance = curDistance;
					closestNode = baseThis.nodeDict[nodeKey];
				}
			}

			//check if closest node is within drag start distance
			if (closestDistance <= baseThis.nodeRadius) {
				baseThis.dragging = true;
				baseThis.dragNode = closestNode;
			}
			
		})
		.on("mousemove", function() {
			//check for node dragging
			if (baseThis.dragging) {
				var coords = d3.mouse(this);
	            var dx = (coords[0] - baseThis.startCoords[0]);
	            var dy = (coords[1] - baseThis.startCoords[1]);
	            console.log(dx)
	            //note the use of the unary operator '+' to convert string attr to int (the first '+' is NOT a concatenation)
	            baseThis.dragNode.attr("x", +baseThis.dragNode.attr("x") + dx);
	        	baseThis.dragNode.attr("y", +baseThis.dragNode.attr("y") + dy);

	        	//move all connected edges depending on whether we are the startNode or the endNode of that edge
	        	var connectedEdge = baseThis.edgeDict[baseThis.dragNode.attr("id")];
	        	if (connectedEdge) {
	        		baseThis.recalculateEdge(connectedEdge);
	        	}
	        	baseThis.startCoords[0] += dx;
	        	baseThis.startCoords[1] += dy;
			}
		})

		.on("mouseup", function() {
			baseThis.dragging = false;
		});

		//construct graph nodes
		for (let name of nodeNames) {
			var circle = nodeParent.append("svg")
				.attr("x", curX)
				.attr("y", curY)
				.attr("width", this.nodeRadius * 2 + this.strokeThickness * 2)
				.attr("height", this.nodeRadius * 2 + this.strokeThickness * 2)
				.attr("isDown",true)
				.attr("id",name)  

			var circleGraphic = circle.append("circle")
				.attr("cx", this.nodeRadius + this.strokeThickness)
				.attr("cy", this.nodeRadius + this.strokeThickness)
				.attr("r", this.nodeRadius)
				.attr("stroke", "black")
				.attr("stroke-width", this.strokeThickness)
				.attr("fill", "rgb(200,200,255)");

			var circleText = circle.append("text")
				.attr("x", this.nodeRadius + this.strokeThickness)
				.attr("y", this.nodeRadius + this.strokeThickness)
				.attr("font-size", "20px")
				.attr("text-anchor", "middle")
				.attr("alignment-baseline", "central")
				.text(name);

			this.nodeDict[name] = circle;
			curY += (this.nodeRadius + this.strokeThickness) * 2 + this.nodeSpacing;
			curX += 50;
		}

		//construct graph edges
		for (let edge of edges) {
			var startNode = this.nodeDict[edge.startNode];
			var endNode = this.nodeDict[edge.endNode];

			var startNodeX = +startNode.attr("x") + +startNode.attr("width") /2;
			var startNodeY = +startNode.attr("y") + +startNode.attr("height") /2;
			var endNodeX = +endNode.attr("x") + +endNode.attr("width") /2;
			var endNodeY = +endNode.attr("y") + +endNode.attr("height") /2;
			
			var edgeWidth = Math.abs(startNodeX - endNodeX);
			var edgeHeight = Math.abs(startNodeY - endNodeY);
			
			var newEdge = edgeParent.append("svg")
			.attr("startNodeID", startNode.attr("id"))
			.attr("endNodeID", endNode.attr("id"));

			var edgeGraphic = newEdge.append("line")
			.attr("stroke-width",this.edgeThickness)
			.attr("stroke", "black");

			this.edgeDict[edge.startNode] = newEdge;
			this.edgeDict[edge.endNode] = newEdge;

			this.recalculateEdge(newEdge);
		}
	}

	/*recalculate position, dimensions, and line position of connectedEdge*/
	recalculateEdge (connectedEdge : any) {
		var edgeLine = connectedEdge.select("line");

		var startNode = this.nodeDict[connectedEdge.attr("startNodeID")];
		var endNode = this.nodeDict[connectedEdge.attr("endNodeID")];

		var startNodeX = +startNode.attr("x") + +startNode.attr("width") /2;
		var startNodeY = +startNode.attr("y") + +startNode.attr("height") /2;
		var endNodeX = +endNode.attr("x") + +endNode.attr("width") /2;
		var endNodeY = +endNode.attr("y") + +endNode.attr("height") /2;

		var minX = Math.min(startNodeX,endNodeX);
		var maxX = Math.max(startNodeX,endNodeX);
		var minY = Math.min(startNodeY,endNodeY);
		var maxY = Math.max(startNodeY,endNodeY);

		var edgeWidth = maxX - minX;
		var edgeHeight = maxY - minY;

		connectedEdge.attr("width", edgeWidth + this.edgeThickness);
		connectedEdge.attr("height", edgeHeight + this.edgeThickness);

		connectedEdge.attr("x", minX - this.edgeThickness/2);
		connectedEdge.attr("y", minY - this.edgeThickness/2);

		if (minX == startNodeX) {
			edgeLine.attr("x1", this.edgeThickness / 2);
			edgeLine.attr("x2", edgeWidth + this.edgeThickness / 2)
		}
		else {
			edgeLine.attr("x1",edgeWidth + this.edgeThickness / 2)
			edgeLine.attr("x2", this.edgeThickness / 2);
		}
		if (minY == startNodeY) {
			edgeLine.attr("y1", this.edgeThickness / 2);
			edgeLine.attr("y2",edgeHeight + this.edgeThickness / 2)
		}
		else {
			edgeLine.attr("y1",edgeHeight + this.edgeThickness/ 2)
			edgeLine.attr("y2", this.edgeThickness / 2);
		}
	}

	updateGraph() {
		/*
		let update = this.graph.selectAll('.bar')
			.data(this.data);

		// remove exiting bars
		update.exit().remove();

		// update existing bars
		this.graph.selectAll('.bar').transition()
			.attr('x', d => 20
			.attr('y', d => 30
			.attr('width', d => this.nodeRadius
			.attr('height', d => this.nodeRadius
			.style('fill', (d, i) => this.colors(i));

		// add new bars
		update
			.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('x', d => 20
			.attr('y', d => 30
			.attr('width', this.nodeRadius
			.attr('height', 0)
			.style('fill', (d, i) => this.colors(i))
			.transition()
			.delay((d, i) => i * 10)
			.attr('y', d => 30);
			.attr('height', d => this.nodeRadius);
		*/
	}
}