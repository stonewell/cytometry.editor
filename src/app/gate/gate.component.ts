import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { GateService } from '../shared/gate.service';
import { Transform } from '../shared/gate-types';

@Component({
  selector: 'app-gate',
  templateUrl: './gate.component.html',
  styleUrls: ['./gate.component.css'],
})
export class GateComponent implements OnInit, OnDestroy {
  subscription: Subscription = new Subscription();

  gateParameters: string[] = [];
  predefinedTransforms: string[] = [];

  xParameter: string;
  yParameter: string;
  gateName: string;

  xTransform: Transform;

  yTransform: Transform;

  constructor(
    private readonly http: HttpClient,
    private readonly gateService: GateService
  ) {
    this.xTransform = gateService.defaultTransform();
    this.yTransform = gateService.defaultTransform();
  }

  ngOnInit(): void {
    this.subscription.add(
      this.gateService.gateLoaded.subscribe((_) => {
        this.gateParameters = this.gateService.gateParameters;
        this.predefinedTransforms = this.gateService.predefinedTransforms;

        this.onGateUpdated();
      })
    );

    this.subscription.add(
      this.gateService.currentGateUpdated.subscribe((evt: any) => {
        if (evt !== 'points') {
          this.onGateUpdated();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onUIUpdate(): void {
    const currentGate = this.gateService.getCurrentGate();

    currentGate.name = this.gateName;

    if (!currentGate.customName) {
      currentGate.name = `${this.xParameter} vs. ${this.yParameter}`;
    }

    currentGate.x = this.xParameter;
    currentGate.y = this.yParameter;

    this.gateService.notifyCurrentGateUpdated();
  }

  onGateUpdated(): void {
    const currentGate = this.gateService.getCurrentGate();

    this.gateName = currentGate.name;
    this.xParameter = currentGate.x;
    this.yParameter = currentGate.y;

    this.xTransform = Object.assign(
      {},
      currentGate.xTransform ||
        this.gateService.getDefaultTransform(this.xParameter)
    );
    this.yTransform = Object.assign(
      {},
      currentGate.yTransform ||
        this.gateService.getDefaultTransform(this.yParameter)
    );

    console.log(this.xTransform);
  }

  onNameUpdate(): void {
    const currentGate = this.gateService.getCurrentGate();

    currentGate.customName = true;
    currentGate.name = this.gateName;

    this.gateService.notifyCurrentGateUpdated('name');
  }

  transformUpdated(evt: any): void {
    console.log('transform updated');
  }
}
