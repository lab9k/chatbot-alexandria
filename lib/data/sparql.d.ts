import { Dictionary } from 'lodash';
export declare class SparqlApi {
    private baseUrl;
    private readonly options;
    constructor(baseUrl: string);
    getAttractions(): Promise<Dictionary<any>[]>;
    getEvents(): Promise<Dictionary<any>[]>;
    private query;
}
