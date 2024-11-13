import {Component, OnInit} from '@angular/core';
import {IslandData, Point} from "../../../models/models";
import {GameService} from "../../../services/game.service";
import {Router} from "@angular/router";
import * as THREE from "three";
import {round} from "three/src/nodes/math/MathNode";

@Component({
  selector: 'app-game-screen-2-d',
  templateUrl: './game-screen-2-d.component.html',
  styleUrls: ['./game-screen-2-d.component.css']
})
export class GameScreen2DComponent implements OnInit{

  islandData?: IslandData

  showArrow: boolean = false
  arrowAngle: number = 0
  cellColors: string[][] = []
  clickedIslands: number[] = []

  playerLivesArr: number[] = []
  showDamage: boolean = false
  isGameOver: boolean = false
  isVictory: boolean = false

  isLivesAnimating = false;
  isCompassAnimating = false;


  constructor(private gameService: GameService, private router: Router) {
  }

  /*
  If we got data we can play
  If the refresh happens try to load saved data
  If there is an error with saved data try to get new data
  Finally if all else fails go back to home
   */
  ngOnInit(): void {
    this.gameService.islandData$.subscribe((data) => {
      if (data) {
        console.log("DATA RECEIVED")
        console.log(data)
        this.islandData = data;

        this.populateCellColors()
      }
      else {
        console.log("SAVED DATA")
        const storedData = localStorage.getItem("islandData")
        if (false) {
          //todo fix this

          // const parsedData = JSON.parse(storedData);
          //
          // this.islandData = {
          //   islandIds: parsedData.islandIds,
          //   islandAvgHeights: new Map(
          //     Object.entries(parsedData.islandAvgHeights).map(([key, value]) => [Number(key), value as number])
          //   ),
          //   islandWithMaxAvgHeightId: parsedData.islandWithMaxAvgHeightId,
          //   islandCenterPoints: new Map(
          //     Object.entries(parsedData.islandCenterPoints).map(([key, value]) => [Number(key), value as Point])
          //   ),
          //   mapData: parsedData.mapData,
          //   heightMap: parsedData.heightMap
          // };
        }
        else {
          console.log("NEW DATA!!!!!!!!!!!!!!!")
          this.gameService.getIslandData().subscribe(
            (fetchedData) => {
              this.islandData = fetchedData
              this.populateCellColors()

            },
            (error) => {this.router.navigate([''])}
          )
        }
      }
    });

    this.playerLivesArr = Array(3).fill(1);
  }

  populateCellColors(): void {
    this.cellColors = this.islandData!.mapData.map(row => row.map(height => this.getCellColor(height)));
  }

  getCellColor(height: number): string {
    if (height === 0) return '#0000FF'; // water
     else return this.heightToColor(height); //land
  }

  heightToColor(height: number): string {
    const water = 0;
    const grass = 200;
    const sand = 400;
    const rock = 600;
    const snow = 800;

    if (height <= water) {
      // Water: Blue
      return '#0000FF';
    } else if (height > water && height <= grass) {
      // Interpolate between Blue and Green
      const t = height / grass;
      return this.interpolateColor('#0000FF', '#00FF00', t);
    }
    else if (height > grass && height <= sand) {
      // Interpolate between Green and Yellow
      const t = (height - grass) / (sand - grass);
      return this.interpolateColor('#00FF00', '#FFFF00', t);
    }
    else if (height > sand && height <= rock) {
      // Interpolate between Yellow and Brown
      const t = (height - sand) / (rock - sand);
      return this.interpolateColor('#FFFF00', '#8B4513', t);
    }
    else if (height > rock && height <= snow) {
      // Interpolate between Brown and White
      const t = (height - rock) / (snow - rock);
      return this.interpolateColor('#8B4513', '#FFFFFF', t);
    }
    else {
      // Default color (above snow)
      return '#FFFFFF'; // White for high altitudes
    }
  }

  grayOutWrongIsland(islandId: number): void {
    if (!this.islandData) {
      console.warn('Island data is not available.');
      return;
    }

    // Iterate through islandIds and gray out matching cells
    this.islandData.islandIds.forEach((row, i) => {
      row.forEach((id, j) => {
        if (id === islandId) {
          this.cellColors[i][j] = '#808080'; // Gray color
        }
      });
    });
  }

  interpolateColor(color1: string, color2: string, t: number): string {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    c1.lerp(c2, t); // Interpolate based on t
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

    this.grayOutWrongIsland(clickedIslandId)
    this.reducePlayerLives()
    this.calculateCompassDirection(clickedIslandId)
  }

  calculateCompassDirection(clickedIslandId: number): void{
    // Retrieve the center points for both islands
    const point1 = this.islandData?.islandCenterPoints.get(clickedIslandId);
    const point2 = this.islandData?.islandCenterPoints.get(this.islandData!.islandWithMaxAvgHeightId);

    const deltaX = point2!.y - point1!.y; // Horizontal difference
    const deltaY = point2!.x - point1!.x; // Vertical difference

    // Calculate the angle in radians
    let angleRadians = Math.atan2(deltaY, deltaX);
    let angleDegrees = angleRadians * (180 / Math.PI);
    angleDegrees += 90;

    if (angleDegrees < 0) {
      angleDegrees += 360;
    }
    this.arrowAngle = angleDegrees
    this.triggerCompassAnimation()
  }

  reducePlayerLives(){
    this.playerLivesArr.pop()
    this.showDamageDisplay()
    this.triggerLivesAnimation()
    if (this.playerLivesArr.length == 0){
      this.isGameOver = true
    }
  }

  triggerLivesAnimation() {
    this.isLivesAnimating = true;
    setTimeout(() => {
      this.isLivesAnimating = false;
    }, 500);
  }

  triggerCompassAnimation() {
    this.isCompassAnimating = true;
    setTimeout(() => {
      this.isCompassAnimating = false;
    }, 500);
  }

  showDamageDisplay(): void {
    this.showDamage = true;
    setTimeout(() => {
      this.showDamage = false;
    }, 1000);
  }



  handleQuit() {
    this.router.navigate([''])
  }

  handleRestart() {
    // this.isVictory = false
    // this.isGameOver = false
    // this.ngOnInit()
    location.reload();
  }


  protected readonly TimeRanges = TimeRanges;
}
