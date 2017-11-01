import { Component, OnInit, Type } from '@angular/core';

import { MockService } from "./test/mock.service";
import { NodeType } from "./domain/uimetadata/form";

import { PouchdbService } from "./pouchdb.service";

@Component({
    selector: 'app-root',
    template: `
        <nav class="navbar navbar-toggleable-md fixed-top navbar-dark bg-primary text-white">
            <button class="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbarResponsive"
                aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <a href="/" class="navbar-brand">Metawiz</a>
            <div class="collapse navbar-collapse" id="navbarResponsive">
                <ul class="navbar-nav">
                    <li class="nav-item" routerLinkActive="active">
                        <a routerLink="/form-editor" class="nav-link">Form editor</a>
                    </li>
                    <li class="nav-item" routerLinkActive="active">
                        <a routerLink="/ecommerce" class="nav-link"><i class="fa fa-cart"></i> E-commerce</a>
                    </li>
                </ul>
            </div>
        </nav>
        <div class="mwz-body">
            <div class="mwz-sidebar mwz-independent-scroll ml-2">
                <mwz-navigation></mwz-navigation>
            </div>
            <div class="mwz-content mwz-independent-scroll ml-2 card">
                <router-outlet></router-outlet>
            </div>
        </div>

        <editor></editor>
  `
})
export class AppComponent implements OnInit {
    title = 'app';

    public constructor(private pouchdb: PouchdbService, private mockService: MockService) {}

    ngOnInit(): void {
        this.pouchdb.sync("http://localhost:5984/mwz");
        this.mockService.loadInitialEntities();
    }
}
