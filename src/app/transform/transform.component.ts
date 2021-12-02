import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  Output,
} from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import {
  TransformType,
  Transform,
  validateTransform,
} from '../shared/gate-types';

@Component({
  selector: 'app-transform',
  templateUrl: './transform.component.html',
  styleUrls: ['./transform.component.css'],
})
export class TransformComponent implements OnInit, OnChanges {
  rName: string;

  @Input() data: Transform;
  dataCopy: Transform;
  @Input() predefinedTransforms: any;

  @Output() transformUpdated: EventEmitter<any> = new EventEmitter();

  errors: string[] = [];

  constructor() {}

  ngOnInit(): void {
    this.rName = uuidv4();
  }

  public get transformType(): typeof TransformType {
    return TransformType;
  }

  onTransformTypeChange(t: TransformType): void {
    this.dataCopy.transformType = t;

    if (t === TransformType.predefined) {
      if (
        !this.dataCopy.predefinedName ||
        this.predefinedTransforms.indexOf(this.dataCopy.predefinedName) < 0
      ) {
        this.dataCopy.predefinedName =
          this.predefinedTransforms.length > 0
            ? this.predefinedTransforms[0]
            : '';
      }
    }

    this.onValueChange();
  }

  onValueChange(): void {
    this.errors = [];

    if (validateTransform(this.dataCopy, this.errors)) {
      Object.assign(this.data, this.dataCopy);

      this.transformUpdated.emit(null);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.dataCopy = Object.assign({}, this.data);
  }
}
