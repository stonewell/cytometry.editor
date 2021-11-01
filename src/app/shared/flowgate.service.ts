import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExpFileChannel {
  shortName: string;
  name: string;
  id: string;
  range: number;
}

export interface ExpFile {
  id: number;
  title: string;
  gates: string[];
  channels: ExpFileChannel[];
  plotMargin: GatePlotMargin;
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
}
