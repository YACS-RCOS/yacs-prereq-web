"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("@angular/core");
var SchedulePeriod = (function () {
    function SchedulePeriod() {
    }
    return SchedulePeriod;
}());
exports.SchedulePeriod = SchedulePeriod;
var Schedule = (function () {
    function Schedule(earliestStart, latestEnd, periods) {
        this.periods = periods;
        // cap earliestStart and latestEnd to the nearest hours
        this.earliestStart = Math.floor(earliestStart / 60) * 60;
        this.latestEnd = Math.ceil(latestEnd / 60) * 60;
        // for now, hardcode Mon-Fri week
        this.earliestDay = 1;
        this.latestDay = 5;
        this.dayNums = [];
        for (var i = this.earliestDay; i <= this.latestDay; ++i) {
            this.dayNums.push(i);
        }
        this.hourNums = [];
        for (var i = this.earliestStart; i < this.latestEnd; i += 60) {
            this.hourNums.push(i);
        }
    }
    Object.defineProperty(Schedule.prototype, "getDaySpan", {
        /* Return the total number of days in the schedule. */
        get: function () {
            return (this.latestDay - this.earliestDay) + 1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Schedule.prototype, "getTimeSpan", {
        /* Return the total number of minutes in the schedule,
         * not including the exact minute of the latestEnd. */
        get: function () {
            return this.latestEnd - this.earliestStart;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Schedule.prototype, "getDayWidth", {
        /* Return the percentage width of a day. */
        get: function () {
            return (100 / this.getDaySpan);
        },
        enumerable: true,
        configurable: true
    });
    return Schedule;
}());
exports.Schedule = Schedule;
var ScheduleComponent = (function () {
    // this uses constants - inject the constants service
    function ScheduleComponent(constants) {
        this.constants = constants;
    }
    ScheduleComponent.prototype.longDayName = function (day) {
        return this.constants.longDayName(day);
    };
    /* Filter and return only the periods on a given day. */
    ScheduleComponent.prototype.periodsOnDay = function (day) {
        return this.schedule.periods.filter(function (p) { return (p.day === day); });
    };
    return ScheduleComponent;
}());
__decorate([
    core_1.Input()
], ScheduleComponent.prototype, "schedule");
ScheduleComponent = __decorate([
    core_1.Component({
        selector: 'schedule',
        templateUrl: './component.html',
        // don't need to specify ConstantsService here as long as
        // it's on the AppComponent
        providers: []
    })
], ScheduleComponent);
exports.ScheduleComponent = ScheduleComponent;
