import { TestBed } from '@angular/core/testing';

import { MxgraphService } from './mxgraph.service';

describe('MxgraphService', () => {
  let service: MxgraphService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MxgraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
