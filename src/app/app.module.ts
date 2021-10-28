import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';

import { GraphService } from './shared/graph.service';
import { GateService } from './shared/gate.service';
import { GatesComponent } from './gates/gates.component';
import { GateComponent } from './gate/gate.component';

import { FlowgateService } from './shared/flowgate.service';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { Routes, RouterModule } from '@angular/router'; // CLI imports router

const routes: Routes = [
  {
    path: '**',
    component: AppComponent,
  },
]; // sets up routes constant where you define your routes

@NgModule({
  declarations: [AppComponent, EditorComponent, GatesComponent, GateComponent],
  imports: [
    FormsModule,
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
  ],
  providers: [GraphService, GateService, FlowgateService],
  bootstrap: [AppComponent],
  exports: [RouterModule],
})
export class AppModule {}
