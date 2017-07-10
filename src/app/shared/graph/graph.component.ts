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
	//private margin: any = { top: 20, bottom: 20, left: 20, right: 20};
	//dictionary of 'name' : 'node' for easy node access during graph construction
	private nodeDict: any = {};
	//dictionary of 'name' : 'list of connected edges' for easy edge access during graph construction
	private edgeDict: any = {};
	//svg attributes
	private nodeRadius : number = 10;
	private svgWidth : number = 800;
	private svgHeight : number = 600;
	private nodeStrokeWidth : number = 2;
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
		let baseThis = this;
		this.svg = d3.select(this.graphContainer.nativeElement).append('svg')
		        .attr("class", "panel")
		        .attr("width", baseThis.svgWidth)
		        .attr("height", baseThis.svgHeight);
	}

	/*load in graph data from prereq file (hosted by data service)*/
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
					hasValidEdge = baseThis.addEdge(circle,baseThis.nodeDict[edge],"prereq") || hasValidEdge;
				}
				for (let edge of node.coreq_formula) {
					baseThis.addEdge(circle,baseThis.nodeDict[edge],"coreq");
				}
				//start at column 0 if we have no prereqs or our prereqs are not in the dataset
				if (node.prereq_formula.length == 0 || !hasValidEdge) {
					baseThis.setColNum(circle,0);
				}
			}

			//layout standard nodes and edges
			baseThis.layoutColumns();
			baseThis.render(baseThis.graph);
		});
	}

	addNode(id:string, containedNodeIds:any) {
		this.graph.nodes.push({"id" : id});
		this.nodeDict[id] = this.graph.nodes[this.graph.nodes.length - 1];
		this.graph.nodes[this.graph.nodes.length-1].containedNodeIds = containedNodeIds;
		return this.nodeDict[id];
	}

	addEdge(startNode:any, endNode:any, edgeType:string) {
		if (startNode && endNode) {
			this.graph.links.push({"source" : startNode.id,"target" : endNode.id});

			if (!this.edgeDict[startNode.id]) {
				this.edgeDict[startNode.id] = [];
			}
			this.edgeDict[startNode.id].push(this.graph.links[this.graph.links-1]);
			if (!this.edgeDict[endNode.id]) {
				this.edgeDict[endNode.id] = [];
			}
			this.edgeDict[endNode.id].push(this.graph.links[this.graph.links-1]);
		}
	}

	/*organize nodes into columns based on their prereqs*/
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
			else if (+curNode.attr("id")[5] >= 4) {
				if (this.edgeDict[curNode.attr("id")] == undefined || this.edgeDict[curNode.attr("id")].length == 0) {
					this.setColNum(curNode,this.columnList.length-1,true);
				}
			}
		}
	}

	/*layout nodes stemming from current node*/
	layoutFromNode(node : any, colNum : number) {
		if (+node.column != colNum) {
			this.setColNum(node,colNum);
		}
		if (this.edgeDict[node.attr("id")]) {
			for (let edge of this.edgeDict[node.attr("id")]) {
				if (edge.attr("endNodeID") == node.attr("id")) {
					this.layoutFromNode(this.nodeDict[edge.attr("startNodeID")],colNum+1);
				}
			}
		}
		
	}

	/*move Node node to column colNum*/
	setColNum(node : any, colNum: number, allowColumnChange = false) {
		if (colNum == node.column) {
			return;
		}
		if (+node.column == -1 || allowColumnChange) {
			//make sure we have enough columns
			while (this.columnList.length < (colNum+1)) {
				this.columnList.push([]);
			}
			if (+node.column != -1) {
				//remove from current column
				let oldColumn = this.columnList[+node.column];
				let oldIndex = oldColumn.indexOf(node);
				oldColumn.splice(oldIndex,1);
				//reposition displaced nodes
				for (let i = oldIndex; i <oldColumn.length; ++i) {
					this.columnList[+node.column][i].attr("column",+node.column);
					
				}
			}
			
			//add to new column
			this.columnList[colNum].push(node);
			this.columnList[colNum][this.columnList[colNum].length-1].attr("column",colNum);
		}
	}
  
  ngAfterViewInit(){
  	let baseThis = this;
    this.svg = d3.select("svg");

    this.color = d3.scaleOrdinal(d3.schemeCategory20);
    
    this.forceGraph = d3.forceSimulation()
        .force("link", d3.forceLink().id(function (d:{ id: string}) {
        return d.id
      }))
      
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(baseThis.svgWidth / 2, baseThis.svgHeight / 2));
    
    this.loadGraphData();
  }
  
  ticked() {
  	let baseThis = this;
    this.link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    this.node
        .attr("cx", function(d) { return d.x = Math.max(baseThis.nodeRadius+baseThis.nodeStrokeWidth, Math.min(baseThis.svgWidth - baseThis.nodeRadius - baseThis.nodeStrokeWidth, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(baseThis.nodeRadius+baseThis.nodeStrokeWidth, Math.min(baseThis.svgHeight - baseThis.nodeRadius - baseThis.nodeStrokeWidth, d.y)); });
  }
  
  render(graph){
  	let baseThis = this;
    this.link = this.svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return 2; })
      .attr("stroke","green");

    this.node = this.svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
      .attr("r", baseThis.nodeRadius)
      .attr("fill", (d)=> { return this.color(d.group); })
      .attr("stroke","blue")
      .attr("stroke-width",baseThis.nodeStrokeWidth)
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
    console.log(graph);
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