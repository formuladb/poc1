import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NodeElement, NodeType2Str, NodeType, Str2NodeType } from '../domain/uimetadata/form';
import { TreeChange } from './tree.change';
import { TreeState } from './tree.state';

@Component({
    selector: 'mwz-tree',
    templateUrl: 'tree.component.html',
    styleUrls: ["tree.component.scss"]
})

export class TreeComponent implements OnInit {
    constructor() { }

    expanded: boolean = false;
    hover: boolean = false;
    edited: boolean = false;

    @Input()
    node: NodeElement;

    @Input()
    index?: number;

    @Input()
    state: TreeState;

    @Output()
    change = new EventEmitter();

    ngOnInit() { }

    get code(): string {
        if (!this.node) return "";
        let s = [NodeType2Str.get(this.node.nodeType)];
        if (null != this.node.propertyName) s.push('=', this.node.propertyName);
        if (null != this.node.tableName) s.push('#', this.node.tableName);
        if (null != this.node.entityName) s.push('.', this.node.entityName);
        if (this.node.attributes) {
            s.push(": ");
            s.push(JSON.stringify(this.node.attributes).replace(/^\{/, '').replace(/\}$/, ''));
        }
        return s.join('');
    }

    set code(c: string) {
        //TODO parse after edit
    }

    private childChange(event: TreeChange) {
        if (null !== event.fromIndex
            && null !== event.toIndex
            && event.toIndex >= 0 && event.toIndex < this.node.childNodes.length) {
            this.node.childNodes.splice(event.fromIndex, 1);
            this.node.childNodes.splice(event.toIndex, 0, event.node);
        }
        if (null !== event.remove) {
            this.node.childNodes.splice(event.remove, 1);
        }
        let tc: TreeChange = new TreeChange(this.node);
        this.change.emit(tc);
    }

    private moveUp(): void {
        let tc: TreeChange = new TreeChange(this.node);
        tc.fromIndex = this.index;
        tc.toIndex = this.index - 1;
        this.change.emit(tc);
    }

    private moveDown(): void {
        let tc: TreeChange = new TreeChange(this.node);
        tc.fromIndex = this.index;
        tc.toIndex = this.index + 1;
        this.change.emit(tc);
    }
    private delete(): void {
        let tc: TreeChange = new TreeChange(this.node);
        tc.remove = this.index;
        this.change.emit(tc);
    }

    private edit(): void {
        this.edited = true;
    }

    private save(): void {
        this.edited = false;
    }

    private isHover: boolean = false;

    set hover(is: boolean) {
        this.isHover = is;
    }

    private hasType(t:string):boolean{
        return this.state.availableTypes.includes(Str2NodeType.get(t));
    }
}