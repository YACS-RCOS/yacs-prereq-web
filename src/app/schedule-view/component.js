"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("@angular/core");
var component_1 = require("./schedule/component");
var SCHEDULE_TEST_DATA = [
    // must instantiate Schedule with new + constructor
    // since it has getter properties that would otherwise have to be declared
    // in this array
    new component_1.Schedule(480, 1200, [
        {
            name: 'sdfsdf',
            crn: 54,
            instructor: 'Dr Sdfsdf',
            day: 1,
            startTime: 480,
            endTime: 540
        }
    ])
];
var ScheduleViewComponent = (function () {
    function ScheduleViewComponent() {
        this.scheduleIndex = 0;
        this.totalSchedules = 0;
        this.isTemporary = false;
        this.status = "";
        this.schedules = SCHEDULE_TEST_DATA;
    }
    Object.defineProperty(ScheduleViewComponent.prototype, "currentSchedule", {
        get: function () {
            return this.schedules[this.scheduleIndex];
        },
        enumerable: true,
        configurable: true
    });
    return ScheduleViewComponent;
}());
ScheduleViewComponent = __decorate([
    core_1.Component({
        selector: 'schedule-view',
        templateUrl: './component.html'
    })
], ScheduleViewComponent);
exports.ScheduleViewComponent = ScheduleViewComponent;
