import { FormElement } from './../domain/uimetadata/form';
import {
    Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone,
    Input, Output, EventEmitter, ChangeDetectionStrategy, HostListener, HostBinding,
    forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'form-input',
    template: `
        <div class="form-group col">
            <label [for]="element.property.name">{{element.property.name}}</label>
            <input class="form-control" type="text" [id]="element.property.name" [(ngModel)]="value" />
        </div>
    `,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FormInputComponent),
            multi: true
        }
    ]
})
export class FormInputComponent implements OnInit, ControlValueAccessor {
    constructor() { }

    @Input() element: FormElement;
    private onChange = (_: any) => { }
    private onTouched = () => { }
    private _value = "";

    get value () {
      return this._value;
    }
    set value(v) {
        this._value = v;
        this.onChange(v);
        this.onTouched();
    }
    ngOnInit(): void { }

    writeValue(obj: any): void {
        this._value = obj;
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled: boolean): void {
        throw new Error("MwzInputComponent: Method not implemented.");
    }
}