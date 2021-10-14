import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';

import { GraphService } from './shared/graph.service';

@NgModule({
  declarations: [AppComponent, EditorComponent],
  imports: [BrowserModule],
  providers: [GraphService],
  bootstrap: [AppComponent],
})
export class AppModule {}
