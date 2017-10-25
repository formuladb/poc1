import { Injectable } from '@angular/core';

import { Subject }    from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subscribable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/observable/from';
import { from } from 'rxjs/observable/from';

import { BaseObj } from './domain/base_obj';
import { Form, FormElement } from './domain/uimetadata/form';
import { Table } from './domain/uimetadata/table';
import { DataObj } from './domain/metadata/data_obj';
import { ChangeObj } from "./domain/change_obj";
import { Entity } from './domain/metadata/entity';
import { Property } from "./domain/metadata/property";

import { TableColumn } from './domain/uimetadata/table';
import { ParserService } from "./parser.service";

import { MockMetadata } from "./test/mocks/mock-metadata";
import * as mockUiMeta from "./test/mocks/mock-ui-metadata";
import { MockData } from "./test/mocks/mock-data";

export type MwzFilter<T> = {_id: string};

@Injectable()
export class BackendReadService {

    private mockMetadata = new MockMetadata();
    public mockData: MockData = new MockData(this.mockMetadata.entitiesMap);
    
    private currentUrl: { path: string, id: string } = { path: null, id: null };
    public table$ = new ReplaySubject<Table|ChangeObj<DataObj>[]>(2);
    public form$ = new ReplaySubject<Form|DataObj>(2);
    public tableForm$ = this.table$.merge(this.form$);
    
    constructor(private parserService: ParserService) {
    }

    public setCurrentPathAndId(path: string, id: string) {
        if (path === this.currentUrl.path && id === this.currentUrl.id) return;

        if (path !== this.currentUrl.path) {
            this.currentUrl.path = path;
            this.table$.next(getDefaultTable(this.mockMetadata.entitiesMap.get(path)));
            this.table$.next(this.mockData.getAll(path).map(o => new ChangeObj(o)));
            this.form$.next(this.getForm(path));
        }

        if (id != this.currentUrl.id) {
            this.form$.next(this.mockData.get(path, id));
        }
        
        // setTimeout(() => {
        //     this.table$.next(getDefaultTable(this.mockMetadata.entitiesMap.get(path)));
        //     setTimeout(() => {
        //         this.table$.next(this.mockData.getAll(path).map(o => new ChangeObj(o)));
        //     }, 50);
        // }, 50);
    }

    private getForm(path: string): Form {
        return this.parserService.parseForm(mockUiMeta.getFormText(path)) ||
            getDefaultForm(this.mockMetadata.entitiesMap.get(path), this.mockMetadata.entitiesMap);
    }
}

export function getDefaultForm(entity: Entity, entitiesMap: Map<string, Entity>): Form {
    let form = new Form();
    form = { nodeName: 'form-grid', _type: "Form_" };
    setFormElementChildren(form, entity, entitiesMap);
    console.log('form:', JSON.stringify(form));
    return form;
}

function setFormElementChildren(parentFormEl: FormElement, entity: Entity, entitiesMap: Map<string, Entity>) {
    parentFormEl.childNodes = entity.properties.map((prop, idx) => {
        let child = new FormElement();
        child.nodeName = 'form-input';
        if (Property.isTable(prop)) {
            child.tableName = prop.name;
            child.nodeName = prop.isLargeTable ? 'form-table': 'form-tabs';
            setFormElementChildren(child, entitiesMap.get(Entity.getPropertyPath(prop)), entitiesMap);
        } else if (Property.isEntity(prop)) {
            child.entityName = prop.name;
            child.nodeName = 'form-autocomplete';
            child.copiedProperties = prop.copiedProperties;
        } else {
            child.propertyName = prop.name;
        }
        
        return {
            nodeName: 'form-grid-row',
            childNodes: [child]
        };
    });
}

export function getDefaultTable(entity: Entity): Table {
    if (null == entity) return null;
    
    let table = new Table();
    table._type = 'Table_';
    table.columns = entity.properties.map((prop, idx) => new TableColumn(prop.name, prop.type));
    return table;
}
