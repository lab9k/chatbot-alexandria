"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
const lodash_1 = require("lodash");
const sparql_1 = require("./sparql");
const types_1 = require("./types");
function getDataCards(type) {
    return __awaiter(this, void 0, void 0, function* () {
        const api = new sparql_1.SparqlApi('https://stad.gent/sparql');
        switch (type) {
            case types_1.RequestType.ATTRACTIONS:
                const attractions = yield api.getAttractions();
                return lodash_1.map(lodash_1.sampleSize(attractions, 4), (attraction) => {
                    return botbuilder_1.CardFactory.heroCard(attraction.name, [{ url: lodash_1.sample(attraction.imagesList) }], [{ type: 'openUrl', title: 'Open Page', value: attraction.strurl }], { subtitle: attraction.description });
                });
            case types_1.RequestType.EVENTS:
                const events = yield api.getEvents();
                return lodash_1.map(lodash_1.sampleSize(events, 4), (event) => {
                    return botbuilder_1.CardFactory.heroCard(event.name, [{ url: lodash_1.sample(event.imagesList) }], [{ type: 'openUrl', title: 'Open Page', value: event.page }], { subtitle: event.description });
                });
            default:
                return Promise.reject('Invalid RequestType');
        }
    });
}
exports.getDataCards = getDataCards;
__export(require("./types"));
//# sourceMappingURL=index.js.map