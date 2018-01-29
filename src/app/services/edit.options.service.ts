import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as appState from '../app.state';
import * as fromEntity from '../entity-state';
import { EntityProperty } from '../domain/metadata/entity';

@Injectable()
export class EditOptionsService {

    public properties: EntityProperty[];

    constructor(private store: Store<appState.AppState>) {
        this.store.select(fromEntity.getSelectedEntityState).subscribe(selectedEntity => {
            this.properties = selectedEntity.properties;
        });
    }
}