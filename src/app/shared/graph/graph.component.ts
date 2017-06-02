import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})

export class GraphComponent implements OnInit {

  @Input() private data: Array<any>;
  @ViewChild('graph') private graphContainer: ElementRef;
  private margin: any = { top: 20, bottom: 20, left: 20, right: 20};
  private graph: any;
  private nodeRadius: number;
  private userCanEdit: boolean;
  private colors: any;
  private strokeWidth : number;

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

    //Draw a circle to verify that we are executing correctly
    console.log(width);
    console.log(height);

  var circle = this.graph.append("svg")
  .attr("x",width/2)
  .attr("y",height/2)
  .attr("width",this.nodeRadius*2+this.strokeWidth*2)
  .attr("height",this.nodeRadius*2+this.strokeWidth*2);

  var circleGraphic = circle.append("circle")
                         .attr("cx", this.nodeRadius+this.strokeWidth)
                         .attr("cy", this.nodeRadius+this.strokeWidth)
                         .attr("r", this.nodeRadius)
                         .attr("stroke","black")
                         .attr("stroke-width",this.strokeWidth)
                         .attr("fill","red");
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
