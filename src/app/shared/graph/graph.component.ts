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
		this.strokeThickness = 3;
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
		var nodeDict = {};
		//dictionary of 'startNodeName' : 'svg parent' and 'endNodeName' : 'svg parent' for easy edge access
		var edgeDict = {};

		//construct edge and node group parents
		var edgeParent = this.graph.append("g").attr("id","edges");
		var nodeParent = this.graph.append("g").attr("id","nodes");

		//construct graph nodes
		var globalEdgeThickness = this.edgeThickness;
		for (let name of nodeNames) {
			var circle = nodeParent.append("svg")
				.attr("x", curX)
				.attr("y", curY)
				.attr("width", this.nodeRadius * 2 + this.strokeThickness * 2)
				.attr("height", this.nodeRadius * 2 + this.strokeThickness * 2)
				.attr("isDown",true)
				.attr("id",name)

				//dragging
				.on("mousedown", function(){
			        this.isDown = true; 
			        this.startCoords = d3.mouse(this);	

			    })
			    .on("mousemove", function(){
			        if(this.isDown) {
			            var coords = d3.mouse(this);
			            var dx = (coords[0] - this.startCoords[0]);
			            var dy = (coords[1] - this.startCoords[1]);
			            //note the use of the unary operator '+' to convert string attr to int (the first '+' is NOT a concatenation)
			            d3.select(this).attr("x", +d3.select(this).attr("x") + dx);
			        	d3.select(this).attr("y", +d3.select(this).attr("y") + dy);

			        	//move all connected edges depending on whether we are the startNode or the endNode of that edge
			        	var connectedEdge = edgeDict[d3.select(this).attr("id")];
			        	if (connectedEdge) {
			        		var edgeLine = connectedEdge.select("line");

			        		var startNode = nodeDict[connectedEdge.attr("startNodeID")];
			        		var endNode = nodeDict[connectedEdge.attr("endNodeID")];

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

							connectedEdge.attr("width", edgeWidth + globalEdgeThickness);
							connectedEdge.attr("height", edgeHeight + globalEdgeThickness);

							connectedEdge.attr("x", minX - globalEdgeThickness/2);
							connectedEdge.attr("y", minY - globalEdgeThickness/2);

							if (minX == startNodeX) {
								edgeLine.attr("x1", globalEdgeThickness / 2);
								edgeLine.attr("x2", edgeWidth + globalEdgeThickness / 2)
							}
							else {
								edgeLine.attr("x1",edgeWidth + globalEdgeThickness / 2)
								edgeLine.attr("x2", globalEdgeThickness / 2);
							}
							if (minY == startNodeY) {
								edgeLine.attr("y1", globalEdgeThickness / 2);
								edgeLine.attr("y2",edgeHeight + globalEdgeThickness / 2)
							}
							else {
								edgeLine.attr("y1",edgeHeight + globalEdgeThickness / 2)
								edgeLine.attr("y2", globalEdgeThickness / 2);
							}
							
			        		//start node
			        		/*if (connectedEdge.attr("startNodeID") == d3.select(this).attr("id")) {
			        			connectedEdge.attr("x", +connectedEdge.attr("x") + dx);
			    				connectedEdge.attr("y", +connectedEdge.attr("y") + dy);
		    					edgeLine.attr("x2", +edgeLine.attr("x2") - dx);
		    					edgeLine.attr("y2", +edgeLine.attr("y2") - dy);

		    					if (+edgeLine.attr("x2") < 2) {
		    						edgeLine.attr("x1", +edgeLine.attr("x1") + (2 - +edgeLine.attr("x2")));
		    						edgeLine.attr("x2",2);
		    					}
		    					if (+edgeLine.attr("y2") < 2) {
		    						edgeLine.attr("y1", +edgeLine.attr("y1") + (2 - +edgeLine.attr("y2")));
		    						edgeLine.attr("y2",2);
		    					}

			    				var edgeThickness = Math.abs(+edgeLine.attr("x2") - +edgeLine.attr("x1"));
								var edgeHeight = Math.abs(+edgeLine.attr("y2") - +edgeLine.attr("y1"));
								connectedEdge.attr("width", edgeThickness + globalEdgeThickness);
								connectedEdge.attr("height", edgeHeight + globalEdgeThickness);
								console.log(edgeLine.attr("x2"))
								console.log(edgeLine.attr("y2"))
			        		}
			        		//end node
			        		else {
			        			connectedEdge.attr("x2", +connectedEdge.attr("x2") + dx);
			    				connectedEdge.attr("y2", +connectedEdge.attr("y2") + dy);

			        		}*/
			        	}
			        }
			     })
			    .on("mouseup", function(){
			        this.isDown = false;
			    });     

			var circleGraphic = circle.append("circle")
				.attr("cx", this.nodeRadius + this.strokeThickness)
				.attr("cy", this.nodeRadius + this.strokeThickness)
				.attr("r", this.nodeRadius)
				.attr("stroke", "black")
				.attr("stroke-width", this.strokeThickness)
				.attr("fill", "red");

			var circleText = circle.append("text")
				.attr("x", this.nodeRadius + this.strokeThickness)
				.attr("y", this.nodeRadius + this.strokeThickness)
				.attr("font-size", "20px")
				.attr("text-anchor", "middle")
				.attr("alignment-baseline", "central")
				.attr("unselectable", "on")
				.text(name);

			nodeDict[name] = circle;
			curY += (this.nodeRadius + this.strokeThickness) * 2 + this.nodeSpacing;
			curX += 50;
		}

		//construct graph edges
		for (let edge of edges) {
			var startNode = nodeDict[edge.startNode];
			var endNode = nodeDict[edge.endNode];

			var startNodeX = +startNode.attr("x") + +startNode.attr("width") /2;
			var startNodeY = +startNode.attr("y") + +startNode.attr("height") /2;
			var endNodeX = +endNode.attr("x") + +endNode.attr("width") /2;
			var endNodeY = +endNode.attr("y") + +endNode.attr("height") /2;
			
			var edgeWidth = Math.abs(startNodeX - endNodeX);
			var edgeHeight = Math.abs(startNodeY - endNodeY);
			
			var newEdge = edgeParent.append("svg")
			.attr("x",startNodeX)
			.attr("y",startNodeY)
			.attr("width", edgeWidth + this.edgeThickness)
			.attr("height", edgeHeight + this.edgeThickness)
			.attr("startNodeID", startNode.attr("id"))
			.attr("endNodeID", endNode.attr("id"))

			var edgeGraphic = newEdge.append("line")
			.attr("x1",this.edgeThickness/2)
			.attr("y1",this.edgeThickness/2)
			.attr("x2",edgeWidth - this.edgeThickness/2)
			.attr("y2",edgeHeight - this.edgeThickness/2)
			.attr("stroke-width",this.edgeThickness)
			.attr("stroke", "black")

			edgeDict[edge.startNode] = newEdge;
			edgeDict[edge.endNode] = newEdge;
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