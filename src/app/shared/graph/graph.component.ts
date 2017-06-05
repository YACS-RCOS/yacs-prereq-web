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
	private strokeWidth: number;
	private edgeWidth: number;
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
		this.strokeWidth = 3;
		this.edgeWidth = 4;
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
		for (let name of nodeNames) {
			var circle = nodeParent.append("svg")
				.attr("x", curX)
				.attr("y", curY)
				.attr("width", this.nodeRadius * 2 + this.strokeWidth * 2)
				.attr("height", this.nodeRadius * 2 + this.strokeWidth * 2)
				.attr("isDown",true)

				//dragging
				.on("mousedown", function(){
			        this.isDown = true; 
			        this.startCoords = d3.mouse(this);	

			    })
			    .on("mousemove", function(){
			        if(this.isDown) {
			            var coords = d3.mouse(this);
			            //note the use of the unary operator '+' to convert string attr to int (the first '+' is NOT a concatenation)
			            d3.select(this).attr("x", +d3.select(this).attr("x") + (coords[0] - this.startCoords[0]));
			        	d3.select(this).attr("y", +d3.select(this).attr("y") + (coords[1] - this.startCoords[1]));
			        }
			     })
			    .on("mouseup", function(){
			        this.isDown = false;
			    });     

			var circleGraphic = circle.append("circle")
				.attr("cx", this.nodeRadius + this.strokeWidth)
				.attr("cy", this.nodeRadius + this.strokeWidth)
				.attr("r", this.nodeRadius)
				.attr("stroke", "black")
				.attr("stroke-width", this.strokeWidth)
				.attr("fill", "red");

			var circleText = circle.append("text")
				.attr("x", this.nodeRadius + this.strokeWidth)
				.attr("y", this.nodeRadius + this.strokeWidth)
				.attr("font-size", "20px")
				.attr("text-anchor", "middle")
				.attr("alignment-baseline", "central")
				.text(name)

			nodeDict[name] = circle;
			curY += (this.nodeRadius + this.strokeWidth) * 2 + this.nodeSpacing;
			curX += 50;
		}

		//construct graph edges
		for (let edge of edges) {
			var startNode = nodeDict[edge.startNode];
			var endNode = nodeDict[edge.endNode];

			//TODO: this feels like the wrong way to access node attributes; there must be a simpler way
			var startNodeX = startNode._groups[0][0]["x"]["baseVal"]["value"] + startNode._groups[0][0]["width"]["baseVal"]["value"] /2;
			var startNodeY = startNode._groups[0][0]["y"]["baseVal"]["value"] + startNode._groups[0][0]["height"]["baseVal"]["value"] /2;
			var endNodeX = endNode._groups[0][0]["x"]["baseVal"]["value"] + startNode._groups[0][0]["width"]["baseVal"]["value"] /2;
			var endNodeY = endNode._groups[0][0]["y"]["baseVal"]["value"] + startNode._groups[0][0]["height"]["baseVal"]["value"] /2;

			var edgeWidth = Math.abs(startNodeX - endNodeX);
			var edgeHeight = Math.abs(startNodeY - endNodeY);
			
			var newEdge = edgeParent.append("svg")
			.attr("x",startNodeX)
			.attr("y",startNodeY)
			.attr("width", edgeWidth + this.edgeWidth)
			.attr("height", edgeHeight + this.edgeWidth)

			var edgeGraphic = newEdge.append("line")
			.attr("x1",this.edgeWidth/2)
			.attr("y1",this.edgeWidth/2)
			.attr("x2",edgeWidth - this.edgeWidth/2)
			.attr("y2",edgeHeight - this.edgeWidth/2)
			.attr("stroke-width",this.edgeWidth)
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