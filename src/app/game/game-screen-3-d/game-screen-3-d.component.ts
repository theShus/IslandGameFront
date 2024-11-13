import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {IslandData, Point} from "../../../models/models";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {GameService} from "../../../services/game.service";
import {Router} from "@angular/router";
import {log} from "three/src/nodes/math/MathNode";

@Component({
  selector: 'app-game-screen-3-d',
  templateUrl: './game-screen-3-d.component.html',
  styleUrls: ['./game-screen-3-d.component.css']
})
export class GameScreen3DComponent implements OnInit, AfterViewInit {

  //game data
  islandData?: IslandData

  //game board display
  @ViewChild('rendererContainer', {static: false}) rendererContainer!: ElementRef;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  terrainMesh!: THREE.Mesh;
  controls!: OrbitControls;
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  clickedIslands: number[] = []

  //player lives
  playerLivesArr: number[] = []
  isLivesAnimating = false;
  showDamage: boolean = false

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
        this.saveIslandData();
      }
      else {
        const loadedData = this.loadIslandData();
        if (loadedData) {
          this.islandData = loadedData;
        } else {
          this.router.navigate([''])
        }
      }
    });
  }


  ngAfterViewInit(): void {
    this.initThreeJS();
    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this), false);
  }

  private initThreeJS(): void {
    // Create the scene
    this.scene = new THREE.Scene();

    // Create the camera
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;
    this.camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 1500);
    this.camera.position.set(20, 15, 12);
    this.camera.lookAt(0, 0, 0);

    // Create the renderer
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);
    this.scene.background = new THREE.Color(0xADD8E6);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 50, 50);
    this.scene.add(directionalLight);

    // Initialize OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Enable inertia
    this.controls.dampingFactor = 0.05;

    // Load the terrain if data is already available
    if (this.islandData) {
      this.createTerrain();
    }

    // Start the animation loop
    this.animate();
  }

  private createTerrain(): void {
    // Clear existing terrain if any
    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.terrainMesh.geometry.dispose();
      (this.terrainMesh.material as THREE.Material).dispose();
    }

    // Ensure islandData is available
    if (!this.islandData) {
      console.error('Data map data is missing.');
      return;
    }

    const mapData = this.islandData.mapData;
    const blurredHeightMap = this.applyGaussianBlur(mapData);

    const width = mapData.length;
    const height = mapData[0].length;
    const geometry = new THREE.PlaneGeometry(width, height, width - 1, height - 1);
    const positionAttribute = geometry.attributes['position'] as THREE.BufferAttribute;

    const colors = [];

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      const z = blurredHeightMap[x][width - 1 - y]; // Use blurred height value so it looks normal-ish and not jagged
      positionAttribute.setZ(i, z / 140); //height was too high so we reduced it to look normal on the board
      const color = this.getHeightColor(z);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    // enable coloring
    const material = new THREE.MeshLambertMaterial({vertexColors: true});

    // Create the mesh
    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.rotation.x = -Math.PI / 2; // Rotate to make it horizontal

    // Add the terrain to the scene
    this.scene.add(this.terrainMesh);

    // Apply grayOutIsland for all clicked islands if the data is reloaded from the save
    this.clickedIslands.forEach(id => this.grayOutIsland(id));
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // equilibrates heights to look normal instead of jagged
  private applyGaussianBlur(heightMap: number[][]): number[][] {
    const width = heightMap.length;
    const height = heightMap[0].length;

    const blurredMap = Array.from({length: width}, () => Array(height).fill(0));
    const gaussianKernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    const kernelSum = 16;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += heightMap[y + ky][x + kx] * gaussianKernel[ky + 1][kx + 1];
          }
        }
        blurredMap[y][x] = sum / kernelSum;
      }
    }

    return blurredMap;
  }

  private getHeightColor(height: number): THREE.Color {
    const color = new THREE.Color();

    const water = 0;
    const grass = 200;
    const sand = 400;
    const rock = 500;
    const snow = 700;

    if (height <= water) {
      color.set('#0000FF');
    }
    else if (height > water && height <= grass) {
      const t = height / grass;  //normalization
      color.lerpColors(new THREE.Color('#0000FF'), new THREE.Color('#00FF00'), t);
    }
    else if (height > grass && height <= sand) {
      const t = (height - grass) / (sand - grass);
      color.lerpColors(new THREE.Color('#00FF00'), new THREE.Color('#FFFF00'), t);
    }
    else if (height > sand && height <= rock) {
      const t = (height - sand) / (rock - sand);
      color.lerpColors(new THREE.Color('#FFFF00'), new THREE.Color('#8B4513'), t);
    }
    else {
      const t = (height - rock) / (snow - rock);
      color.lerpColors(new THREE.Color('#8B4513'), new THREE.Color('#FFFFFF'), t);
    }
    return color;
  }

  private onMouseClick(event: MouseEvent): void {
    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObject(this.terrainMesh);

    if (intersects.length > 0) {
      const intersect = intersects[0];

      // Get the intersected point on the terrain
      const point = intersect.point;

      // Calculate grid coordinates
      const x = Math.floor(point.x + (this.islandData!.mapData.length / 2));
      const y = Math.floor(-point.z + (this.islandData!.mapData[0].length / 2));

      // Ensure coordinates are within bounds
      if (x >= 0 && x < this.islandData!.mapData.length && y >= 0 && y < this.islandData!.mapData[0].length) {
        const islandId = this.islandData!.islandIds[x][y];
        if (islandId !== 0) {
          console.log(`Clicked on island ID: ${islandId}`);
          this.onIslandClick(islandId)
        }
      }
    }
  }

  onIslandClick(clickedIslandId: number): void {
    if (clickedIslandId === this.islandData!.islandWithMaxAvgHeightId) {
      this.isVictory = true
      this.isGameOver = true
      return
    }

    if (this.clickedIslands.includes(clickedIslandId)) return
    this.clickedIslands.push(clickedIslandId)

    this.reducePlayerLives()
    this.grayOutIsland(clickedIslandId)
    this.saveIslandData();
  }

  private grayOutIsland(islandId: number): void {
    if (!this.terrainMesh || !this.islandData) return;

    const geometry = this.terrainMesh.geometry as THREE.BufferGeometry;
    const colors = geometry.attributes['color'] as THREE.BufferAttribute;
    const width = this.islandData.mapData.length;
    const height = this.islandData.mapData[0].length;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (this.islandData.islandIds[x][y] === islandId) {
          const flippedY = height - 1 - y;
          const vertexIndex = flippedY * width + x;
          colors.setXYZ(vertexIndex, 0.5, 0.5, 0.5);
        }
      }
    }
    colors.needsUpdate = true;
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
        this.createTerrain()
        this.saveIslandData()
      },
      (error) => {this.router.navigate([''])}
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
      clickedIslands: this.clickedIslands
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

      return reconstructedData;
    } catch (error) {
      console.error("Error parsing IslandData from localStorage:", error)
      return null
    }
  }

}
