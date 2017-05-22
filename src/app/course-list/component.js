"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("@angular/core");
var COURSELIST_TEST_DATA = [
    {
        id: 1,
        name: 'Data Structures',
        num: '1200',
        departmentCode: 'CSCI',
        minCredits: 4,
        maxCredits: 4,
        description: 'Hash maps. Hash maps everywhere.',
        sections: [
            {
                id: 1,
                courseId: 1,
                name: '01',
                crn: 1337,
                instructors: ['Cutler', 'Thompson'],
                seats: 10,
                seatsTaken: 3,
                conflicts: [34, 54, 63],
                periods: [
                    { form: 'LEC', startTime: 3480, endTime: 3590 },
                    { form: 'TES', startTime: 3960, endTime: 4070 },
                    { form: 'LAB', startTime: 4920, endTime: 5030 },
                    { form: 'LEC', startTime: 6360, endTime: 6470 }
                ]
            },
            {
                id: 2,
                courseId: 1,
                name: '02',
                crn: 1338,
                instructors: ['Cutler', 'Thompson'],
                seats: 10,
                seatsTaken: 6,
                conflicts: [34, 54, 63],
                periods: [
                    { form: 'LEC', startTime: 3480, endTime: 3590 },
                    { form: 'TES', startTime: 3960, endTime: 4070 },
                    { form: 'LAB', startTime: 5040, endTime: 5150 },
                    { form: 'LEC', startTime: 6360, endTime: 6470 }
                ]
            }
        ]
    }
];
var CourseListComponent = (function () {
    function CourseListComponent() {
        this.courses = COURSELIST_TEST_DATA;
    }
    return CourseListComponent;
}());
CourseListComponent = __decorate([
    core_1.Component({
        selector: 'course-list',
        templateUrl: './component.html'
    })
], CourseListComponent);
exports.CourseListComponent = CourseListComponent;
