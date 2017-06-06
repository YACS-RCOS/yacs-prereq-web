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
	private nodeFontSize : number;

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
		//maintain a reference to this in case we need to access it while inside a selection
		let baseThis = this;

		let width = window.innerWidth;
		let height = window.innerHeight;

		let element = this.graphContainer.nativeElement;
		this.graph = d3.select(element).append('svg')
			.attr("width","100%")
			.attr("height","600")
			//.attr('width', width)
			//.attr('height', height);

		// init constants
		this.nodeRadius = 30;
		this.userCanEdit = false;
		this.strokeThickness = 2;
		this.edgeThickness = 4;
		this.nodeSpacing = 12;
		this.nodeFontSize = 12;

		let curX: number = this.nodeSpacing;
		let curY: number = this.nodeSpacing;

		//hard-code nodes and edges until we reimplement loading prereqs from JSON
		type edge = {startNode: string, endNode: string}
		
		/*let nodeNames: string[] = ["CSCI 1100", "CSCI 1200", "CSCI 2100"]*/
		let edges : edge[] = [({startNode:"CSCI 1100",endNode:"CSCI 1200"}),({startNode:"CSCI 1200",endNode:"CSCI 2100"})]

		let nodeData;
		let metaNodeData;
		d3.json("/assets/prereq_data.json", function(prereqs) {
			nodeData = prereqs["CSCI_nodes"];
			metaNodeData = prereqs["meta_nodes"];
			//dictionary of 'name' : 'svg parent' for easy node access
			baseThis.nodeDict = {};
			//dictionary of 'name' : 'list of connected edges' for easy edge access
			baseThis.edgeDict = {};

			//construct edge and node group parents
			let edgeParent = baseThis.graph.append("g").attr("id","edges");
			let nodeParent = baseThis.graph.append("g").attr("id","nodes");

			let nodeCounter = 0;

			//setup mouse events on graph
			baseThis.graph.on("mousedown", function() {
				//poll for closest node on mouseDown
				baseThis.startCoords = d3.mouse(this);
				let closestNode = null;
				let closestDistance = -1;
				for (let nodeKey in baseThis.nodeDict) {
					let curCircle = baseThis.nodeDict[nodeKey];
					//distance formula
					let curDistance = Math.sqrt(
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
					let coords = d3.mouse(this);
		            let dx = (coords[0] - baseThis.startCoords[0]);
		            let dy = (coords[1] - baseThis.startCoords[1]);
		            console.log(dx)
		            //note the use of the unary operator '+' to convert string attr to int (the first '+' is NOT a concatenation)
		            baseThis.dragNode.attr("x", +baseThis.dragNode.attr("x") + dx);
		        	baseThis.dragNode.attr("y", +baseThis.dragNode.attr("y") + dy);

		        	//move all connected edges depending on whether we are the startNode or the endNode of that edge
		        	let connectedEdges = baseThis.edgeDict[baseThis.dragNode.attr("id")];
		        	if (connectedEdges) {
		        		for (let curEdge of connectedEdges) {
		        			baseThis.recalculateEdge(curEdge);
		        		}
		        	}
		        	baseThis.startCoords[0] += dx;
			        baseThis.startCoords[1] += dy;
				}
			})

			.on("mouseup", function() {
				baseThis.dragging = false;
			});

			//construct graph nodes
			for (let node of nodeData) {
				//node parent
				let circle = nodeParent.append("svg")
					.attr("x", curX)
					.attr("y", curY)
					.attr("width", baseThis.nodeRadius * 2 + baseThis.strokeThickness * 2)
					.attr("height", baseThis.nodeRadius * 2 + baseThis.strokeThickness * 2)
					.attr("isDown",true)
					.attr("id",node.course_uid)  

				//node circle element
				let circleGraphic = circle.append("circle")
					.attr("cx", baseThis.nodeRadius + baseThis.strokeThickness)
					.attr("cy", baseThis.nodeRadius + baseThis.strokeThickness)
					.attr("r", baseThis.nodeRadius)
					.attr("stroke", "black")
					.attr("stroke-width", baseThis.strokeThickness)
					.attr("fill", "rgb(200,200,255)");

				//node text element
				let circleText = circle.append("text")
					.attr("class", "svgtxt")
					.attr("x", baseThis.nodeRadius + baseThis.strokeThickness)
					.attr("y", baseThis.nodeRadius + baseThis.strokeThickness)
					.attr("font-size", baseThis.nodeFontSize + "px")
					.attr("text-anchor", "middle")
					.attr("alignment-baseline", "central")
					.text(node.course_uid);
					

				baseThis.nodeDict[node.course_uid] = circle;
				curY += (baseThis.nodeRadius + baseThis.strokeThickness) * 2 + baseThis.nodeSpacing;
				++nodeCounter;
				if (nodeCounter == 5) {
					nodeCounter = 0;
					curX += (baseThis.nodeRadius + baseThis.strokeThickness) * 2 + baseThis.nodeSpacing;
					curY = baseThis.nodeSpacing;
				}
			}

			//construct graph edges
			for (let edge of edges) {
				let startNode = baseThis.nodeDict[edge.startNode];
				let endNode = baseThis.nodeDict[edge.endNode];

				if (! (startNode && endNode)) {
					continue;
				}

				let startNodeX = +startNode.attr("x") + +startNode.attr("width") /2;
				let startNodeY = +startNode.attr("y") + +startNode.attr("height") /2;
				let endNodeX = +endNode.attr("x") + +endNode.attr("width") /2;
				let endNodeY = +endNode.attr("y") + +endNode.attr("height") /2;
				
				let edgeWidth = Math.abs(startNodeX - endNodeX);
				let edgeHeight = Math.abs(startNodeY - endNodeY);
				
				//edge parent
				let newEdge = edgeParent.append("svg")
				.attr("startNodeID", startNode.attr("id"))
				.attr("endNodeID", endNode.attr("id"));

				//edge line element
				let edgeGraphic = newEdge.append("line")
				.attr("stroke-width",baseThis.edgeThickness)
				.attr("stroke", "black");

				if (!baseThis.edgeDict[edge.startNode]) {
					baseThis.edgeDict[edge.startNode] = [];
				}
				baseThis.edgeDict[edge.startNode].push(newEdge);
				if (!baseThis.edgeDict[edge.endNode]) {
					baseThis.edgeDict[edge.endNode] = [];
				}
				baseThis.edgeDict[edge.endNode].push(newEdge);

				baseThis.recalculateEdge(newEdge);
			}
		});
	}

	/*recalculate position, dimensions, and line position of connectedEdge*/
	recalculateEdge (connectedEdge : any) {
		let edgeLine = connectedEdge.select("line");

		let startNode = this.nodeDict[connectedEdge.attr("startNodeID")];
		let endNode = this.nodeDict[connectedEdge.attr("endNodeID")];

		let startNodeX = +startNode.attr("x") + +startNode.attr("width") /2;
		let startNodeY = +startNode.attr("y") + +startNode.attr("height") /2;
		let endNodeX = +endNode.attr("x") + +endNode.attr("width") /2;
		let endNodeY = +endNode.attr("y") + +endNode.attr("height") /2;

		let minX = Math.min(startNodeX,endNodeX);
		let maxX = Math.max(startNodeX,endNodeX);
		let minY = Math.min(startNodeY,endNodeY);
		let maxY = Math.max(startNodeY,endNodeY);

		let edgeWidth = maxX - minX;
		let edgeHeight = maxY - minY;

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