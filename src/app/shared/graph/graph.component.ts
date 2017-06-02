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
    let element = this.graphContainer.nativeElement;
    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // make SVG container
    this.graph = svg.append('g')
    .attr("width", 1024)
    .attr("height", 768);


	//Draw a circle to verify that we are executing correctly
	var circle = this.graph.append("circle")
                         .attr("cx", 30)
                         .attr("cy", 30)
                         .attr("r", 20);

    // init constants
    this.nodeRadius = 40;
    this.userCanEdit = false;
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
