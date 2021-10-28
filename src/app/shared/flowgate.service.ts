import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExpFileChannel {
  shortName: string;
  name: string;
  id: string;
}

export interface ExpFile {
  id: number;
  title: string;
  gates: string[];
  channel: ExpFileChannel[];
}

@Injectable({
  providedIn: 'root',
})
export class FlowgateService {
  constructor(private readonly httpClient: HttpClient) {}

  getFileInfo(id: string) {
    this.httpClient
      .get<ExpFile>('/expFile/renderFcsInfoWithGateTree/2')
      .subscribe((data) => {
        console.log(JSON.stringify(data));
      });
  }
}
