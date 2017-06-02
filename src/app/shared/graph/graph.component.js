"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("@angular/core");
var d3 = require("d3");
var GraphComponent = (function () {
    function GraphComponent() {
        this.margin = { top: 20, bottom: 20, left: 20, right: 20 };
    }
    GraphComponent.prototype.ngOnInit = function () {
        this.createGraph();
        if (this.data) {
            this.updateGraph();
        }
    };
    GraphComponent.prototype.ngOnChanges = function () {
        if (this.graph) {
            this.updateGraph();
        }
    };
    GraphComponent.prototype.createGraph = function () {
        var element = this.chartContainer.nativeElement;
        this.width = element.offsetWidth - this.margin.left - this.margin.right;
        this.height = element.offsetHeight - this.margin.top - this.margin.bottom;
        var svg = d3.select(element).append('svg')
            .attr('width', element.offsetWidth)
            .attr('height', element.offsetHeight);
        // chart plot area
        this.graph = svg.append('g')
            .attr('class', 'bars')
            .attr('transform', "translate(" + this.margin.left + ", " + this.margin.top + ")");
        // define X & Y domains
        var xDomain = this.data.map(function (d) { return d[0]; });
        var yDomain = [0, d3.max(this.data, function (d) { return d[1]; })];
        // create scales
        this.xScale = d3.scaleBand().padding(0.1).domain(xDomain).rangeRound([0, this.width]);
        this.yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0]);
        // bar colors
        this.colors = d3.scaleLinear().domain([0, this.data.length]).range(['red', 'blue']);
        // x & y axis
        this.xAxis = svg.append('g')
            .attr('class', 'axis axis-x')
            .attr('transform', "translate(" + this.margin.left + ", " + (this.margin.top + this.height) + ")")
            .call(d3.axisBottom(this.xScale));
        this.yAxis = svg.append('g')
            .attr('class', 'axis axis-y')
            .attr('transform', "translate(" + this.margin.left + ", " + this.margin.top + ")")
            .call(d3.axisLeft(this.yScale));
    };
    GraphComponent.prototype.updateGraph = function () {
        var _this = this;
        // update scales & axis
        this.xScale.domain(this.data.map(function (d) { return d[0]; }));
        this.yScale.domain([0, d3.max(this.data, function (d) { return d[1]; })]);
        this.colors.domain([0, this.data.length]);
        this.xAxis.transition().call(d3.axisBottom(this.xScale));
        this.yAxis.transition().call(d3.axisLeft(this.yScale));
        var update = this.graph.selectAll('.bar')
            .data(this.data);
        // remove exiting bars
        update.exit().remove();
        // update existing bars
        this.graph.selectAll('.bar').transition()
            .attr('x', function (d) { return _this.xScale(d[0]); })
            .attr('y', function (d) { return _this.yScale(d[1]); })
            .attr('width', function (d) { return _this.xScale.bandwidth(); })
            .attr('height', function (d) { return _this.height - _this.yScale(d[1]); })
            .style('fill', function (d, i) { return _this.colors(i); });
        // add new bars
        update
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', function (d) { return _this.xScale(d[0]); })
            .attr('y', function (d) { return _this.yScale(0); })
            .attr('width', this.xScale.bandwidth())
            .attr('height', 0)
            .style('fill', function (d, i) { return _this.colors(i); })
            .transition()
            .delay(function (d, i) { return i * 10; })
            .attr('y', function (d) { return _this.yScale(d[1]); })
            .attr('height', function (d) { return _this.height - _this.yScale(d[1]); });
    };
    return GraphComponent;
}());
__decorate([
    core_1.Input()
], GraphComponent.prototype, "data");
__decorate([
    core_1.ViewChild('chart')
], GraphComponent.prototype, "chartContainer");
GraphComponent = __decorate([
    core_1.Component({
        selector: 'app-graph',
        templateUrl: './graph.component.html',
        styleUrls: ['./graph.component.css']
    })
], GraphComponent);
exports.GraphComponent = GraphComponent;
