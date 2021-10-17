import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';

import { GraphService } from './shared/graph.service';
import { GatesComponent } from './gates/gates.component';

@NgModule({
  declarations: [AppComponent, EditorComponent, GatesComponent],
  imports: [BrowserModule],
  providers: [GraphService],
  bootstrap: [AppComponent],
})
export class AppModule {}
