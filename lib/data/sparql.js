"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const fs = require("fs");
const lodash_1 = require("lodash");
const path = require("path");
class SparqlApi {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.options = {
            debug: 'on',
            format: 'application/sparql-results+json',
        };
    }
    getAttractions() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = fs
                .readFileSync(path.join(__dirname, '..', '..', 'queries', 'attractions.rq'))
                .toString();
            const d = yield this.query(query);
            return rawParse(d);
        });
    }
    getEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = fs
                .readFileSync(path.join(__dirname, '..', '..', 'queries', 'events.rq'))
                .toString();
            const d = yield this.query(query);
            return rawParse(d);
        });
    }
    query(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield axios_1.default.get(this.baseUrl, {
                params: Object.assign({}, this.options, { query }),
            });
            return data;
        });
    }
}
exports.SparqlApi = SparqlApi;
const onlyNl = (item) => item.name['xml:lang'] === 'nl';
const rawParse = (rawData) => {
    const { head: { vars: properties }, results: { bindings: items }, } = rawData;
    return lodash_1.map(lodash_1.filter(items, onlyNl), (item) => {
        const picked = lodash_1.pick(item, properties);
        return lodash_1.mapValues(picked, (v, key) => {
            const { value } = v;
            if (key.includes('List')) {
                return value.split(', ');
            }
            return value;
        });
    });
};
//# sourceMappingURL=sparql.js.map