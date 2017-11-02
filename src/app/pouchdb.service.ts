import { Injectable } from '@angular/core';

import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';

import { BaseObj } from "./domain/base_obj";
import { ChangeObj } from "./domain/change_obj";
import { DataObj } from "./domain/metadata/data_obj";
import { Entity } from "./domain/metadata/entity";
import { Table } from "./domain/uimetadata/table";
import { Form } from "./domain/uimetadata/form";

@Injectable()
export class PouchdbService {

    private localDB: any;
    private remoteEventsDB: any;
    private remoteDataDBUrl = 'http://localhost:5984/mwzdata';
    private remoteEventsDBUrl = 'http://localhost:5984/mwzevents';

    constructor() {
        PouchDB.plugin(PouchFind);
        this.localDB = new PouchDB("mwz");
    }

    public init(callback: () => void) {
        this.remoteEventsDB = new PouchDB(this.remoteEventsDBUrl);

        this.localDB.createIndex({
            index: { fields: ['mwzType'] }
        }).then(() => {
            let appStateS = this;

            //first catchup local PouchDB with what happened on the server while the application was stopped
            this.localDB.replicate.from(this.remoteDataDBUrl)
                .on('complete', info => {
                    //after initial replication from the server is finished, continue with live replication
                    this.localDB.replicate.from(this.remoteDataDBUrl, {
                        live: true,
                        retry: true,
                    })
                        .on('error', err => console.error(err));

                    //application specific initialization
                    callback();
                })
                .on('error', err => console.error(err));
        });
    }    

    public findByMwzType<T extends BaseObj>(mwzType: string): Promise<T[]> {
        return this.localDB.find({
            selector: {
                mwzType: mwzType
            }
        }).then((res: { docs: T[] }) => {
            return res.docs;
        }).catch(err => console.error(err));
    }

    public postAction(action: any) {
        this.remoteEventsDB.post(action)
        .catch(err => {
            console.log(err);
        });
    }

    public getEntity(path: string): Promise<Entity> {
        //the Entity's _id is the path
        return this.localDB.get(path);
    }

    public getTable(path: string): Promise<Table> {
        return this.localDB.get('Table_:' + path);
    }

    public getForm(path: string): Promise<Form> {
        return this.localDB.get('Form_:' + path);
    }

    public getDataObj(id: string): Promise<DataObj> {
        return this.localDB.get(id);
    }

    // private put(id: string, document: BaseObj): Promise<any> {
    //     document._id = id;
    //     return this.get(id).then(result => {
    //         document._rev = result._rev;
    //         return this.localDB.put(document);
    //     }, error => {
    //         if (error.status == "404") {
    //             return this.localDB.put(document);
    //         } else {
    //             return new Promise((resolve, reject) => {
    //                 reject(error);
    //             });
    //         }
    //     });
    // }    
}
