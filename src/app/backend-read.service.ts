import { Injectable } from '@angular/core';

import { Subject }    from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subscribable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import { from } from 'rxjs/observable/from';

import { BaseObj } from './domain/base_obj';
import { Form } from './domain/uimetadata/form';
import { Table } from './domain/uimetadata/table';
import { DataObj } from './domain/metadata/data_obj';
import { ChangeObj } from "./domain/change_obj";
import { Entity } from './domain/metadata/entity';

import { TableColumn } from './domain/uimetadata/table';

import { MockMetadata } from "./test/mocks/mock-metadata";
import { MockData } from "./test/mocks/mock-data";

export type MwzFilter<T> = {_id: string};

@Injectable()
export class BackendReadService {

    private mockData: MockData = new MockData();
    private mockMetadata = new MockMetadata();
    private table$ = new Subject<Table|ChangeObj<DataObj>[]>();

    constructor() {
    }

    public syncTable(path: string): Observable<Table|ChangeObj<DataObj>[]> {
        setTimeout(() => {
            this.table$.next(BackendReadService.getDefaultTable(this.mockMetadata.entitiesMap.get(path)));
            setTimeout(() => {
                this.table$.next(this.mockData.getAll(path).map(o => new ChangeObj(o)));
            }, 100);
        }, 100);
        return this.table$;
    }
    
    public static getDefaultForm(entity: Entity): Form {
        let form = new Form();
        form = { nodeName: 'mwz-gridster', mwzType: "Form_" };
        form.childNodes = entity.properties.map((prop, idx) => ({
            nodeName: 'mwz-gridster-row',
            childNodes: [{
                nodeName: 'mwz-gridster-col',
                childNodes: [{
                    nodeName: 'mwz-input',
                    attributes: { formControlName: prop.name }
                }]
            }]
        }));
        return form;
    }

    public static getDefaultTable(entity: Entity): Table {
        if (null == entity) return null;
        
        let table = new Table();
        table.columns = entity.properties.map((prop, idx) => new TableColumn(prop.name, prop.type));
        return table;
    }
}