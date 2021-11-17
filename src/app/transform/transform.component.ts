import { Component, OnInit, Input } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { TransformType, Transform } from '../shared/gate-types';

@Component({
  selector: 'app-transform',
  templateUrl: './transform.component.html',
  styleUrls: ['./transform.component.css'],
})
export class TransformComponent implements OnInit {
  rName: string;

  @Input() data: Transform;
  @Input() predefinedTransforms: any;

  constructor() {
  }

  ngOnInit(): void {
    this.rName = uuidv4();
  }

  public get transformType(): typeof TransformType {
    return TransformType;
  }

  onTransformTypeChange(t: TransformType): void {
    this.data.transformType = t;
  }
}
