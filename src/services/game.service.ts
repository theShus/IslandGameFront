// src/app/services/game.service.ts

import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, map, Observable, tap} from 'rxjs';
import {CommandResponse, IslandData, Point} from "../models/models";
import {environment} from "../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class GameService {

  private islandDataSubject = new BehaviorSubject<IslandData | null>(null);
  islandData$ = this.islandDataSubject.asObservable();

  constructor(private http: HttpClient) {}

  getIslandData(): Observable<IslandData> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-token-here',
      'Custom-Header': 'CustomHeaderValue'
    });

    return this.http.get<CommandResponse<IslandData>>(environment.apiBaseUrl + environment.apiDataEndpoint).pipe(
      map((response) => this.processIslandData(response)),
      tap((data) => this.islandDataSubject.next(data)
      )
    );
  }

  private processIslandData(response: CommandResponse<IslandData>): IslandData {
    if (!response.success) {
      alert(response.message || 'Failed to get island data');
    }
    const data = response.data;

    return {
      islandIds: data.islandIds,
      islandAvgHeights: new Map(Object.entries(data.islandAvgHeights).map(([key, value]) => [Number(key), value])),
      islandWithMaxAvgHeightId: data.islandWithMaxAvgHeightId,
      islandCenterPoints: new Map(Object.entries(data.islandCenterPoints).map(([key, value]) => [Number(key), value as Point])
      ),
      mapData: data.mapData,
    };
  }

}
