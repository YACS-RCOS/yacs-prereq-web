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
	styleUrls: ['./graph.component.scss']
	 /*styles: [`
    .noselect {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
	}
  `]*/
})

export class GraphComponent implements OnInit {

	@Input() private data: Array < any > ;
	@ViewChild('graph') private graphContainer: ElementRef;
	//private margin: any = { top: 20, bottom: 20, left: 20, right: 20};
	//dictionary of 'name' : 'node' for easy node access during graph construction
	private nodeDict: any = {};
	//list of d3 nodes
	private nodes : any = [];
	//list of d3 links
	private edges : any = [];
	//dictionary of 'name' : 'list of connected edges' for easy edge access during graph construction
	private edgeDict: any = {};
	//reference to graph base svg
	private vis : any;
	//list of lists, where each list contains the order in which nodes appear in the column corresponding to the list #
	private columnList : any = [];

	private forceGraph : any;

	constructor() {

	}

	ngOnInit() {
		this.vis = d3.select("#graph").append("svg:svg")
		        .attr("class", "panel")
		        .attr("width", 800)
		        .attr("height", 600);
		this.loadGraphData();
	}

	/*create the main graph svg and load in the course data*/
	createGraph() {
		let baseThis = this;
		this.forceGraph = d3.forceSimulation()
				.force("link", d3.forceLink())//.id(function(d) { return d.index }))
		      	//.gravity(.05)
		        //.charge(-400)
		        .force("charge",d3.forceManyBody())
		        //.distance(150)
		        .nodes(this.nodes);
		        //.size([800, 600]);
		this.forceGraph.force("link").links(this.edges)
		this.forceGraph.on("tick", function(e) {
		  baseThis.vis.selectAll("circle")
		    .attr("cx", function(d) { return d.x; })
		    .attr("cy", function(d) { return d.y; });
			  
		  baseThis.vis.selectAll("line")
		    .attr("x1", function(d) { return d.source.x; })
		    .attr("y1", function(d) { return d.source.y; })
		    .attr("x2", function(d) { return d.target.x; })
		    .attr("y2", function(d) { return d.target.y; });
			     
		  baseThis.vis.selectAll('text.aEnd')
		    .attr('x', function(d) { return this.xpos(d.source, d.target); })
		    .attr('y', function(d) { return this.ypos(d.source, d.target); });
			     
		  baseThis.vis.selectAll('text.zEnd')
		    .attr('x', function(d) { return this.xpos(d.target, d.source); })
		    .attr('y', function(d) { return this.ypos(d.target, d.source); });
		});
		  
		this.restart();
	}

	/*load in graph data from prereq file (hosted by data service)*/
	loadGraphData() {
		let baseThis = this;
		d3.json("http://localhost:3100/CSCI", function(prereqs) {
			let nodeData = prereqs["CSCI_nodes"];
			let metaNodeData = prereqs["meta_nodes"];
			//first construct meta-nodes as standard nodes depend on their existence for edge creation
			for (let metaNode of metaNodeData) {
				baseThis.addNode(metaNode.meta_uid, metaNode.contains);
			}

			//construct graph nodes
			for (let node of nodeData) {
				let circle = baseThis.addNode(node.course_uid,null);

				//construct edges based off of this node's prereqs and coreqs
				for (let edge of node.prereq_formula) {
					baseThis.addEdge(circle,baseThis.nodeDict[edge],"prereq");
				}
				for (let edge of node.coreq_formula) {
					baseThis.addEdge(circle,baseThis.nodeDict[edge],"coreq");
				}
			}

			//create our graph once the data has been loaded
			baseThis.createGraph();
		});
	}

	addNode(id:string, contains:any) {
		this.nodes.push({"id" : id});
		this.nodeDict[id] = this.nodes[this.nodes.length - 1];
		return this.nodeDict[id];
	}

	addEdge(startNode:any, endNode:any, edgeType:string) {
		if (startNode && endNode) {
			this.edges.push({"source" : this.nodes.indexOf(startNode),"target" : this.nodes.indexOf(endNode)});
		}
	}

	restart() {	    
	    let link = this.vis.selectAll("line")
	      .data(this.edges).enter()
	      .insert("svg:g", "circle") // insert before the nodes
	      .attr('class', 'link');
	    this.addLink(link);

	    let node = this.vis.selectAll("circle")
	      .data(this.nodes).enter()
	      .append("svg:circle")
	      //.call(this.forceGraph.drag)
	      .attr("class", "node")
	      .attr("r", 10)
	      .attr("cx", function(d) { return d.x; })
	      .attr("cy", function(d) { return d.y; });   
	}
	  
	xpos(s, t) {
	  var angle = Math.atan2(t.y - s.y, t.x - s.x);
	  return 30 * Math.cos(angle) + s.x;
	};

	ypos(s, t) {
	  var angle = Math.atan2(t.y - s.y, t.x - s.x);
	  return 30 * Math.sin(angle) + s.y;
	};

	addLink(l) {
	  l.append('svg:line')
	  .attr("class", "outline")
	  .attr("x1", function(d) { return d.source.x; })
	  .attr("y1", function(d) { return d.source.y; })
	  .attr("x2", function(d) { return d.target.x; })
	  .attr("y2", function(d) { return d.target.y; });
	  
	  l.append('svg:line')
	  .attr("class", function(d) { return d.type; })
	  .attr("x1", function(d) { return d.source.x; })
	  .attr("y1", function(d) { return d.source.y; })
	  .attr("x2", function(d) { return d.target.x; })
	  .attr("y2", function(d) { return d.target.y; });
	  
	  l.append('svg:text')
	  .attr('class', 'aEnd')
	  .attr('x', function(d) { return d.source.x; })
	  .attr('y', function(d) { return d.source.y; })
	  .attr('text-anchor', 'middle')
	  .text(function(d) { return d.a; });

	  l.append('svg:text')
	  .attr('class', 'zEnd')
	  .attr('x', function(d) { return d.target.x; })
	  .attr('y', function(d) { return d.target.y; })
	  .attr('text-anchor', 'middle')
	  .text(function(d) { return d.z; });
	}
}