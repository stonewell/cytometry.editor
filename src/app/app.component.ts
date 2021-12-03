import { Component, OnInit } from '@angular/core';
import { GateService } from './shared/gate.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'editor';
  gateEditorSessionId = 'session-id';

  constructor(
    private readonly gateService: GateService,
    private activeRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe((params) => {
      const expFile = params['expFile'];

      if (expFile) {
        this.gateService.loadGate(expFile);
      }
    });
  }
}
