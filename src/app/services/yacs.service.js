"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("@angular/core");
require("rxjs/add/operator/catch");
require("rxjs/add/operator/map");
require("rxjs/add/operator/toPromise");
var YacsService = (function () {
    function YacsService(http) {
        this.http = http;
        this.baseUrl = 'http://yacs.cs.rpi.edu/api/v5';
    }
    YacsService.prototype.get = function (path, params) {
        if (params === void 0) { params = {}; }
        return this.http.get(this.baseUrl + "/" + path + "?" + this.objectToQueryString(params))
            .toPromise()
            .then(this.extractData)["catch"](this.handleError);
    };
    YacsService.prototype.extractData = function (response) {
        return response.json() || [];
    };
    YacsService.prototype.objectToQueryString = function (params) {
        return Object.keys(params).reduce(function (prev, key, i) { return ("" + prev + (i !== 0 ? '&' : '') + key + "=" + params[key]); }, '');
    };
    YacsService.prototype.handleError = function (error) {
        var errorMessage = "YACS API Error - " + error;
        console.error(errorMessage);
        return Promise.reject(errorMessage);
    };
    return YacsService;
}());
YacsService = __decorate([
    core_1.Injectable()
], YacsService);
exports.YacsService = YacsService;
