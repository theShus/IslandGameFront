// src/app/services/game.service.ts

import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, map, Observable, tap} from 'rxjs';
import {CommandResponse, IslandData} from "../models/models";
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
      tap((data) => {
        this.islandDataSubject.next(data)
        localStorage.setItem("islandData", JSON.stringify(data)) //in case the player refreshes the page, we can try to get the data back
      })
    );
  }

  private processIslandData(response: CommandResponse<IslandData>): IslandData {
    if (!response.success) {
      throw new Error(response.message || 'Failed to get island data');
    }
    const data = response.data;

    return {
      islandIds: data.islandIds,
      islandAvgHeights: data.islandAvgHeights,
      islandWithMaxAvgHeightId: data.islandWithMaxAvgHeightId,
      islandCenterPoints: data.islandCenterPoints,
      mapData: data.mapData, // Optional property
    };
  }

}
