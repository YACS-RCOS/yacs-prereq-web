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
		var nodeDict = {};

		//construct edge and node group parents
		var edgeParent = this.graph.append("g").attr("id","edges");
		var nodeParent = this.graph.append("g").attr("id","nodes");

		//construct graph nodes
		for (let name of nodeNames) {
			var circle = nodeParent.append("svg")
				.attr("x", curX)
				.attr("y", curY)
				.attr("width", this.nodeRadius * 2 + this.strokeWidth * 2)
				.attr("height", this.nodeRadius * 2 + this.strokeWidth * 2);

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

			var startNodeX = startNode._groups[0][0]["x"]["animVal"]["value"] + startNode._groups[0][0]["width"]["animVal"]["value"] /2;
			var startNodeY = startNode._groups[0][0]["y"]["animVal"]["value"] + startNode._groups[0][0]["height"]["animVal"]["value"] /2;
			var endNodeX = endNode._groups[0][0]["x"]["animVal"]["value"] + startNode._groups[0][0]["width"]["animVal"]["value"] /2;
			var endNodeY = endNode._groups[0][0]["y"]["animVal"]["value"] + startNode._groups[0][0]["height"]["animVal"]["value"] /2;

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
			.attr("x2",edgeWidth + this.edgeWidth/2)
			.attr("y2",edgeHeight + this.edgeWidth/2)
			.attr("stroke-width",this.edgeWidth)
			.attr("stroke", "black")
			console.log(startNode);
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