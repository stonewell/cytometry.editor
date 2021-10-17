import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-gate',
  templateUrl: './gate.component.html',
  styleUrls: ['./gate.component.css']
})
export class GateComponent implements OnInit, OnDestroy {
  subscription: Subscription = new Subscription();

  _jsonURL: string = './assets/data/fginfo_3.json';

  gateData: any;
  gateParameters: string[] = [];

  xParameter: string;
  yParameter: string;
  gateName: string;

  constructor(private readonly http: HttpClient) { }

  ngOnInit(): void {
    this.subscription.add(this.getJSON().subscribe((data) => {
      this.gateData = data;

      for(const key in data.parameters) {
        this.gateParameters.push(key);
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getJSON(): Observable<any> {
    return this.http.get(this._jsonURL);
  }

  onUpdate(): void {
    console.log(`${this.gateName}:${this.xParameter},${this.yParameter}`);
  }
}
