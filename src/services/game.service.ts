// src/app/services/game.service.ts

import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import {BehaviorSubject, map, Observable, tap} from 'rxjs';
import {CommandResponse, IslandData, Point} from "../models/models";
import {environment} from "../environments/environment";
import {materialLineGapSize} from "three/src/nodes/accessors/MaterialNode";

@Injectable({
  providedIn: 'root',
})
export class GameService {

  private islandDataSubject = new BehaviorSubject<IslandData | null>(null);
  islandData$ = this.islandDataSubject.asObservable();

  serverStatus: 'online' | 'offline' | 'loading' = 'loading';

  constructor(private http: HttpClient) {}

  getIslandData(): Observable<IslandData> {
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

  checkServerConnection(){
    this.http.get<void>(environment.apiBaseUrl + environment.apiCheckEndpoint, { observe: 'response' }).subscribe(
        (response: HttpResponse<void>) => {
          if (response.status === 200) {
            this.serverStatus = 'online';
          } else {
            this.serverStatus = 'offline';
          }
        },
        (error) => {
          this.serverStatus = 'offline';
          console.error('Server connection failed:', error);
        }
      );
  }
}
