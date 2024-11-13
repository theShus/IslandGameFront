import {Component, OnInit} from '@angular/core';
import {IslandData, Point} from "../../../models/models";
import {GameService} from "../../../services/game.service";
import {Router} from "@angular/router";
import * as THREE from "three";

@Component({
  selector: 'app-game-screen-2-d',
  templateUrl: './game-screen-2-d.component.html',
  styleUrls: ['./game-screen-2-d.component.css']
})
export class GameScreen2DComponent implements OnInit {

  //game data
  islandData?: IslandData

  //game board
  cellColors: string[][] = []
  clickedIslands: number[] = []

  //compass
  arrowAngle: number = 0
  isCompassAnimating = false;

  //player lives
  playerLivesArr: number[] = []
  showDamage: boolean = false
  isLivesAnimating = false;

  //game state
  isGameOver: boolean = false
  isVictory: boolean = false


  constructor(private gameService: GameService, private router: Router) {
  }

  /*
  If we got data we can play
  If the refresh happens try to load saved data
  else go back to home
   */
  ngOnInit(): void {
    this.gameService.islandData$.subscribe((data) => {
      if (data) {
        this.islandData = data;
        this.playerLivesArr = Array(3).fill(1);
        this.populateCellColors()
        this.saveIslandData();
      } else {
        const loadedData = this.loadIslandData();
        if (loadedData) {
          this.islandData = loadedData;
          this.populateCellColors()

        } else {
          this.router.navigate([''])
        }
      }
    });
  }

  private populateCellColors(): void {
    this.cellColors = this.islandData!.mapData.map(row => row.map(height => this.getCellColor(height)));

    // Apply grayOut after reload
    this.clickedIslands.forEach(id => this.grayOutIsland(id));
  }

  private getCellColor(height: number): string {
    if (height === 0) return '#0000FF'; // water
    else return this.heightToColor(height); //land
  }

  private heightToColor(height: number): string {
    const water = 0;
    const grass = 200;
    const sand = 400;
    const rock = 600;
    const snow = 800;

    if (height <= water) {
      return '#0000FF';
    }
    else if (height > water && height <= grass) {
      const t = height / grass;
      return this.interpolateColor('#0000FF', '#00FF00', t);
    }
    else if (height > grass && height <= sand) {
      const t = (height - grass) / (sand - grass);
      return this.interpolateColor('#00FF00', '#FFFF00', t);
    }
    else if (height > sand && height <= rock) {
      const t = (height - sand) / (rock - sand);
      return this.interpolateColor('#FFFF00', '#8B4513', t);
    }
    else if (height > rock && height <= snow) {
      const t = (height - rock) / (snow - rock);
      return this.interpolateColor('#8B4513', '#FFFFFF', t);
    }
    else {
      return '#FFFFFF';
    }
  }

  private interpolateColor(color1: string, color2: string, t: number): string {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    c1.lerp(c2, t);
    return `rgb(${Math.round(c1.r * 255)}, ${Math.round(c1.g * 255)}, ${Math.round(c1.b * 255)})`;
  }

  onCellClick(width: number, height: number): void {
    const clickedIslandId = this.islandData!.islandIds[width][height];
    if (clickedIslandId == 0) return

    if (clickedIslandId === this.islandData!.islandWithMaxAvgHeightId) {
      this.isVictory = true
      this.isGameOver = true
      return
    }

    if (this.clickedIslands.includes(clickedIslandId)) return
    this.clickedIslands.push(clickedIslandId)

    this.grayOutIsland(clickedIslandId)
    this.reducePlayerLives()
    this.calculateCompassDirection(clickedIslandId)
    this.saveIslandData();
  }

  private grayOutIsland(islandId: number): void {
    if (!this.islandData) {
      console.error('Island data is not available.');
      return;
    }

    // Iterate through islandIds and gray out matching cells
    this.islandData.islandIds.forEach((row, i) => {
      row.forEach((id, j) => {
        if (id === islandId) {
          this.cellColors[i][j] = '#808080';
        }
      });
    });
  }

  private calculateCompassDirection(clickedIslandId: number): void {
    const point1 = this.islandData?.islandCenterPoints.get(clickedIslandId);
    const point2 = this.islandData?.islandCenterPoints.get(this.islandData!.islandWithMaxAvgHeightId);

    const deltaX = point2!.y - point1!.y; // Horizontal difference
    const deltaY = point2!.x - point1!.x; // Vertical difference

    // Calculate the angle in radians
    let angleRadians = Math.atan2(deltaY, deltaX);
    let angleDegrees = angleRadians * (180 / Math.PI);
    angleDegrees += 90; //it was off by 90 deg

    if (angleDegrees < 0) {
      angleDegrees += 360;
    }
    this.arrowAngle = angleDegrees
    this.triggerCompassAnimation()
  }

  private reducePlayerLives() {
    this.playerLivesArr.pop()
    this.showDamageDisplay()
    this.triggerLivesAnimation()
    if (this.playerLivesArr.length == 0) {
      this.isGameOver = true
    }
  }

  private triggerLivesAnimation() {
    this.isLivesAnimating = true;
    setTimeout(() => {
      this.isLivesAnimating = false;
    }, 500);
  }

  private triggerCompassAnimation() {
    this.isCompassAnimating = true;
    setTimeout(() => {
      this.isCompassAnimating = false;
    }, 500);
  }

  private showDamageDisplay(): void {
    this.showDamage = true;
    setTimeout(() => {
      this.showDamage = false;
    }, 1000);
  }


  handleQuit() {
    this.router.navigate([''])
  }

  handleRestart() {
    this.isVictory = false
    this.isGameOver = false
    this.clickedIslands = []
    this.playerLivesArr = Array(3).fill(1)

    this.gameService.getIslandData().subscribe(
      (fetchedData) => {
        this.islandData = fetchedData
        this.populateCellColors()
        this.saveIslandData()
      },
      (error) => {
        this.router.navigate([''])
      }
    )
  }

  private saveIslandData(): void {
    if (!this.islandData) {
      console.error("No IslandData to save.")
      return;
    }

    const serializedData = {
      ...this.islandData,
      islandAvgHeights: Array.from(this.islandData.islandAvgHeights.entries()),
      islandCenterPoints: Array.from(this.islandData.islandCenterPoints.entries()),
      playerLives: this.playerLivesArr.length,
      clickedIslands: this.clickedIslands,
      arrowAngle: this.arrowAngle
    };

    try {
      localStorage.setItem('islandData', JSON.stringify(serializedData));
    } catch (error) {
      console.error("Error saving IslandData to localStorage:", error);
    }
  }

  private loadIslandData(): IslandData | null {
    const jsonData = localStorage.getItem('islandData');
    if (!jsonData) {
      console.error("No IslandData found in localStorage.")
      return null;
    }

    try {
      const parsedData = JSON.parse(jsonData)
      const reconstructedData: IslandData = {
        islandIds: parsedData.islandIds,
        islandAvgHeights: new Map<number, number>(parsedData.islandAvgHeights),
        islandWithMaxAvgHeightId: parsedData.islandWithMaxAvgHeightId,
        islandCenterPoints: new Map<number, Point>(parsedData.islandCenterPoints),
        mapData: parsedData.mapData,
      };
      this.clickedIslands = parsedData.clickedIslands
      this.playerLivesArr = Array(parsedData.playerLives).fill(1)
      this.arrowAngle = parsedData.arrowAngle

      return reconstructedData;
    } catch (error) {
      console.error("Error parsing IslandData from localStorage:", error)
      return null
    }
  }
}
