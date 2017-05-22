"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("@angular/core");
var FLAVORTEXTS = [
    'A grass-fed, free-ranged',
    'The best',
    'Yet another',
    'An experimental GMO',
    'A radioactive',
    'A zombie',
    'An',
    'A pizza-funded',
    'An ice tea powered',
    'A lone computer runs this',
    'Some guy\'s',
    'A (somewhat) tested',
    'Batteries not included in this',
    'A GMO-free',
    'A mutant',
    'The second biggest',
    'A longstanding',
    'A Red Hat-supported',
    'A 100% all natural',
    'A third-generation',
    'A heavily debugged',
    'A filmed on location',
    'A Y2K compliant',
    'A vortigaunt maintained',
    'Degree not included in this',
    '9/10 mindless drones recommend this',
    'Ask your doctor before using this',
    'Far more work than necessary went into this',
    'An officially cursed',
    'A caffeine-powered',
    'Better than your mother\'s',
    'A kid-tested, mother-approved',
    'A science-backed',
    'A somewhat broken',
    'A PHP-free',
    'A dog-friendly',
    'A cat-approved',
    'A dishwasher-safe',
    'An employee-owned',
    'Don\'t restart your computer while using this',
    'A painstakingly crafted',
    'A geothermal powered',
    'A mighty fine',
    'A hydrophobic'
];
var FooterComponent = (function () {
    function FooterComponent() {
        var index = Math.floor(Math.random() * FLAVORTEXTS.length);
        this.flavortext = FLAVORTEXTS[index];
    }
    return FooterComponent;
}());
FooterComponent = __decorate([
    core_1.Component({
        selector: 'footer',
        templateUrl: './component.html'
    })
], FooterComponent);
exports.FooterComponent = FooterComponent;
