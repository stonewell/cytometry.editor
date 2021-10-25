import { Component, OnInit } from '@angular/core';
import { GateService } from './shared/gate.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'editor';

  constructor(private readonly gateService: GateService) {}

  ngOnInit(): void {
    this.gateService.loadGate('');
  }
}
