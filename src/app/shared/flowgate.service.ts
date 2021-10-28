import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FlowgateService {
  constructor(private readonly httpClient: HttpClient) {
  }

  getFileInfo(id: string) {
    this.httpClient.get(
      '/project/list',
      {
        responseType:'text'
      }
    ).subscribe((data) => {
      console.log(JSON.stringify(data));
    });
  }
}
