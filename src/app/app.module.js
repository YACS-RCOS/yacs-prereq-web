"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var platform_browser_1 = require("@angular/platform-browser");
var core_1 = require("@angular/core");
var forms_1 = require("@angular/forms");
var http_1 = require("@angular/http");
var module_1 = require("./app-router/module");
var app_component_1 = require("./app.component");
var component_1 = require("./header/component");
var component_2 = require("./footer/component");
var module_2 = require("./school-list/module");
var module_3 = require("./course-list/module");
var module_4 = require("./schedule-view/module");
var constants_1 = require("./services/constants");
var AppModule = (function () {
    function AppModule() {
    }
    return AppModule;
}());
AppModule = __decorate([
    core_1.NgModule({
        imports: [
            platform_browser_1.BrowserModule,
            forms_1.FormsModule,
            http_1.HttpModule,
            module_1.AppRouterModule,
            module_2.SchoolListModule,
            module_3.CourseListModule,
            module_4.ScheduleViewModule
        ],
        declarations: [
            app_component_1.AppComponent,
            component_1.HeaderComponent,
            component_2.FooterComponent
        ],
        providers: [
            constants_1.ConstantsService
        ],
        bootstrap: [app_component_1.AppComponent]
    })
], AppModule);
exports.AppModule = AppModule;
