import { Component, OnInit } from '@angular/core';
import { GateService } from './shared/gate.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'editor';
  gateEditorSessionId = 'session-id';
  expFileId = 'expFileId';

  subscription: Subscription = new Subscription();

  constructor(
    private readonly gateService: GateService,
    private activeRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.gateService.gateLoaded.subscribe((_) => {
        this.gateEditorSessionId = this.gateService.gateEditSession();

        console.log(`gate edit session:${this.gateEditorSessionId}`);
      })
    );

    this.activeRoute.queryParams.subscribe((params) => {
      this.expFileId = params['expFile'];
      this.gateEditorSessionId = params['gateEditSession'];

      const newGate = params['newGate'] === '1';

      if (this.expFileId) {
        this.gateService.loadGate(this.expFileId, this.gateEditorSessionId, newGate);
      }
    });
  }
}
