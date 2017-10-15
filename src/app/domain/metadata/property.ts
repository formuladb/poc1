import { BaseObj } from '../base_obj';
export class Property {
    name:string;
    type:string;
    allow_null?:boolean;
    copied_properties?: string[];
    default?: any;
    formula?: any;
    grid_row?: number;
    index?: number;
}
