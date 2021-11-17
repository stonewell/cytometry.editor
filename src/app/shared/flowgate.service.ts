import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExpFileChannel {
  shortName: string;
  name: string;
  id: string;
  range: number;
}

export interface ExpFileGate {
  id: number;
  gateJson: string;
}

export interface ExpFileTransform {
  transformName: string;
  transformType: string;
  parameterValues: any;
  isPredefined: boolean;
  channel: string;
}

export interface ExpFile {
  id: number;
  title: string;
  gates: ExpFileGate[];
  channels: ExpFileChannel[];
  plotMargin: GatePlotMargin;
  predefinedTransforms: ExpFileTransform[];
  defaultTransforms: ExpFileTransform[];
}

export interface GatePlotMargin {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

@Injectable({
  providedIn: 'root',
})
export class FlowgateService {
  constructor(private readonly httpClient: HttpClient) {}

  getFileInfoWithGateTree(id: string): Observable<ExpFile> {
    const url = `/expFile/renderFcsInfoWithGateTree/${id}`;

    return this.httpClient.get<ExpFile>(url);
  }

  updateGatePlot(expFile: ExpFile, gatesJson: string): Observable<any> {
    const url = `/expFile/updateGatePlot`;

    return this.httpClient.post<any>(url, {
      expFile: expFile.id,
      gates: JSON.parse(gatesJson),
    });
  }
}
