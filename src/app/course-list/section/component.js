"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("@angular/core");
var Period = (function () {
    function Period() {
    }
    return Period;
}());
exports.Period = Period;
var Section = (function () {
    function Section() {
    }
    return Section;
}());
exports.Section = Section;
var SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sam'];
var MINUTES_PER_DAY = 1440;
var SectionComponent = (function () {
    function SectionComponent() {
    }
    SectionComponent.prototype.getDay = function (period) {
        console.log(period);
        // Assume that the period doesn't include midnight, so only worry about the start time.
        return SHORT_DAYS[Math.floor(period.startTime / MINUTES_PER_DAY)];
    };
    /**
     * Convert minutes-since-start-of-week number to an ordinary time.
     * 600 = 10a
     * 610 = 10:10a
     * 720 = 12p
     * etc
     * This should possibly be a service.
     */
    SectionComponent.prototype.timeToString = function (weekMinutes) {
        var dayMinutes = weekMinutes % MINUTES_PER_DAY;
        var hour = Math.floor(dayMinutes / 60);
        var minutes = dayMinutes % 60;
        var ampm = 'a';
        var minuteShow = '';
        if (hour >= 12) {
            ampm = 'p';
            if (hour > 12) {
                hour -= 12;
            }
        }
        if (minutes === 0) {
            minuteShow = '';
        }
        else {
            minuteShow = ':' + (minutes < 10 ? '0' : '') + minutes;
        }
        return hour + minuteShow + ampm;
    };
    SectionComponent.prototype.getHours = function (period) {
        return this.timeToString(period.startTime) + '-' + this.timeToString(period.endTime);
    };
    return SectionComponent;
}());
__decorate([
    core_1.Input()
], SectionComponent.prototype, "section");
SectionComponent = __decorate([
    core_1.Component({
        selector: 'section',
        templateUrl: './component.html'
    })
], SectionComponent);
exports.SectionComponent = SectionComponent;
