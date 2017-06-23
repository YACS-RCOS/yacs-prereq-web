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
	templateUrl: './graph.component.html',
	styleUrls: ['./graph.component.scss']
})

export class GraphComponent implements OnInit {

	@Input() private data: Array < any > ;
	@ViewChild('graph') private graphContainer: ElementRef;
	//private margin: any = { top: 20, bottom: 20, left: 20, right: 20};
	//dictionary of 'name' : 'node' for easy node access during graph construction
	private nodeDict: any = {};
	//list of d3 nodes
	//private nodes : any = [];
	//list of d3 links
	//private edges : any = [];
	//dictionary of 'name' : 'list of connected edges' for easy edge access during graph construction
	private edgeDict: any = {};
	//reference to graph base svg
	private svg : any;

	private graph : any = {nodes:[],links:[]};
	
	private color : any;
	private link : any;
	private node : any;
	//list of lists, where each list contains the order in which nodes appear in the column corresponding to the list #
	private columnList : any = [];

	private forceGraph : any;

	constructor() {

	}

	ngOnInit() {
		this.svg = d3.select(this.graphContainer.nativeElement).append('svg')
		        .attr("class", "panel")
		        .attr("width", 800)
		        .attr("height", 600);
		//this.loadGraphData();
	}

	/*create the main graph svg and load in the course data*/
	/*createGraph() {
		let baseThis = this;
		this.forceGraph = d3.forceSimulation()
				.force("link", d3.forceLink().id(function(d:any) { return d.index; }))
		      	//.gravity(.05)
		        //.charge(-400)
		        .force("charge",d3.forceManyBody())
		        //.distance(150)
		        .graph.nodes(this.graph.nodes);
		        //.size([800, 600]);
		this.forceGraph.force("link").links(this.graph.links)
		this.forceGraph.on("tick", function(e) {
		  baseThis.svg.selectAll("circle")
		    .attr("cx", function(d) { return d.x; })
		    .attr("cy", function(d) { return d.y; });
			  
		  baseThis.svg.selectAll("line")
		    .attr("x1", function(d) { return d.source.x; })
		    .attr("y1", function(d) { return d.source.y; })
		    .attr("x2", function(d) { return d.target.x; })
		    .attr("y2", function(d) { return d.target.y; });
			     
		  baseThis.svg.selectAll('text.aEnd')
		    .attr('x', function(d) { return baseThis.xpos(d.source, d.target); })
		    .attr('y', function(d) { return baseThis.ypos(d.source, d.target); });
			     
		  baseThis.svg.selectAll('text.zEnd')
		    .attr('x', function(d) { return baseThis.xpos(d.target, d.source); })
		    .attr('y', function(d) { return baseThis.ypos(d.target, d.source); });
		});
		  
		this.restart();
	}*/

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
			}
			for (let node of nodeData) {
				//construct edges based off of this node's prereqs and coreqs
				for (let edge of node.prereq_formula) {
					baseThis.addEdge(baseThis.nodeDict[node.course_uid],baseThis.nodeDict[edge],"prereq");
				}
				for (let edge of node.coreq_formula) {
					baseThis.addEdge(baseThis.nodeDict[node.course_uid],baseThis.nodeDict[edge],"coreq");
				}
			}

			console.log(baseThis.graph);

			//create our graph once the data has been loaded
			//baseThis.createGraph();
		});
	}

	addNode(id:string, contains:any) {
		this.graph.nodes.push({"id" : id});
		this.nodeDict[id] = this.graph.nodes[this.graph.nodes.length - 1];
		return this.nodeDict[id];
	}

	addEdge(startNode:any, endNode:any, edgeType:string) {
		if (startNode && endNode) {
			//this.graph.links.push({"source" : this.graph.nodes.indexOf(startNode),"target" : this.graph.nodes.indexOf(endNode)});
			this.graph.links.push({"source" : startNode.id,"target" : endNode.id});
		}
	}

	/*restart() {	    
	    let link = this.svg.selectAll("line")
	      .data(this.graph.links).enter()
	      .insert("svg:g", "circle") // insert before the nodes
	      .attr('class', 'link');
	    this.addLink(link);

	    let node = this.svg.selectAll("circle")
	      .data(this.graph.nodes).enter()
	      .append("svg:circle")
	      //.call(this.forceGraph.drag)
	      .attr("class", "node")
	      .attr("r", 10)
	      .attr("cx", function(d) { return d.x; })
	      .attr("cy", function(d) { return d.y; });   
	}*/
  
  ngAfterViewInit(){
    this.svg = d3.select("svg");
    
    var width = +this.svg.attr("width");
    var height = +this.svg.attr("height");

    this.color = d3.scaleOrdinal(d3.schemeCategory20);
    
    this.forceGraph = d3.forceSimulation()
        .force("link", d3.forceLink().id(function (d:{ id: string}) {
        return d.id
      }))
      
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));
    
    this.loadGraphData();
    this.render(this.graph);
  }
  
  ticked() {
    this.link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    this.node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }
  
  render(graph){
    this.link = this.svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

    this.node = this.svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
      .attr("r", 5)
      .attr("fill", (d)=> { return this.color(d.group); })
      .call(d3.drag()
          .on("start", (d)=>{return this.dragstarted(d)})
          .on("drag", (d)=>{return this.dragged(d)})
          .on("end", (d)=>{return this.dragended(d)}));

    this.node.append("title")
      .text(function(d) { return d.id; });

    this.forceGraph
      .nodes(graph.nodes)
      .on("tick", ()=>{return this.ticked()});

    this.forceGraph.force("link")
      .links(graph.links);  
  }
  
  dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  
  dragended(d) {
    if (!d3.event.active) this.forceGraph.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  
  dragstarted(d) {
    if (!d3.event.active) this.forceGraph.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
}