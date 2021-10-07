import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';

import { MXGraphService } from './shared/mxgraph.service';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    MXGraphService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
