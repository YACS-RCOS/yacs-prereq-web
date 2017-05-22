"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("@angular/core");
var School = (function () {
    function School() {
    }
    return School;
}());
exports.School = School;
var SCHOOL_TEST_DATA = [
    {
        id: 1,
        name: 'Science',
        departments: [
            {
                id: 1,
                code: 'CSCI',
                name: 'Computer Science'
            },
            {
                id: 2,
                code: 'MATH',
                name: 'Mathematics'
            }
        ]
    }
];
var SchoolListComponent = (function () {
    function SchoolListComponent(yacsService) {
        this.yacsService = yacsService;
    }
    SchoolListComponent.prototype.getSchools = function () {
        var _this = this;
        this.yacsService
            .get('schools')
            .then(function (data) { return _this.schools = data['schools']; });
    };
    SchoolListComponent.prototype.ngOnInit = function () {
        this.getSchools();
        console.log(this.schools);
    };
    return SchoolListComponent;
}());
SchoolListComponent = __decorate([
    core_1.Component({
        selector: 'schools',
        templateUrl: './component.html'
    })
], SchoolListComponent);
exports.SchoolListComponent = SchoolListComponent;
