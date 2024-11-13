export interface Point {
  x: number;
  y: number;
}

export interface IslandData {
  islandIds: number[][];
  islandAvgHeights: Map<number, number>;
  islandWithMaxAvgHeightId: number;
  islandCenterPoints: Map<number, Point>;
  mapData: number[][];
}


export interface CommandResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
