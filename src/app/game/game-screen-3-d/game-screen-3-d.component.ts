import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {IslandData} from "../../../models/models";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {GameService} from "../../../services/game.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-game-screen-3-d',
  templateUrl: './game-screen-3-d.component.html',
  styleUrls: ['./game-screen-3-d.component.css']
})
export class GameScreen3DComponent implements OnInit, AfterViewInit {

  islandData?: IslandData

  @ViewChild('rendererContainer', { static: false })
  rendererContainer!: ElementRef;

  // Three.js variables
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private terrainMesh!: THREE.Mesh;

  private controls!: OrbitControls;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();


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
        this.islandData = data;
      }
      else {
        console.log("SAVED DATA")
        const storedData = localStorage.getItem("islandData")
        if (storedData) { this.islandData = JSON.parse(storedData) }
        else {
          console.log("NEW DATA!!!!!!!!!!!!!!!")
          this.gameService.getIslandData().subscribe(
            (fetchedData) => {
              this.islandData = fetchedData
            },
            (error) => {this.router.navigate([''])}
          )
        }
      }
    });
  }

  ngAfterViewInit(): void {
    console.log("in after")
    this.initThreeJS();
    // window.addEventListener('resize', this.onWindowResize.bind(this), false);
    // this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this), false);

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
          // Implement your logic here, e.g., check if it's the island with the highest average height
        } else {
          console.log('Clicked on water.');
        }
      }
    }
  }


  private initThreeJS(): void {
    // Create the scene
    this.scene = new THREE.Scene();

    // Create the camera
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;
    this.camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 1000);
    this.camera.position.set(200, 200, 20);
    this.camera.lookAt(0, 0, 0);

    // Create the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    this.scene.background = new THREE.Color( 0xADD8E6 );

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

    // Ensure islandData and heightMap are available
    if (!this.islandData) {
      console.error('Height map data is missing.');
      return;
    }

    const mapData = this.islandData.mapData;

    const width = mapData.length;
    const height = mapData[0].length;

    const scaleFactor = 15;

    const blurredHeightMap = this.applyGaussianBlur(mapData);

    const geometry = new THREE.PlaneGeometry(width, height, width - 1, height - 1);

    const positionAttribute = geometry.attributes['position'] as THREE.BufferAttribute;

    const colors = [];

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      // const z = heightMap[width - 1 - x][y];
      const z = blurredHeightMap[width - 1 - x][y]; // Use blurred height value
      positionAttribute.setZ(i, z / 10);
      const color = this.getHeightColor(z);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({ vertexColors: true });

    // Create the mesh
    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.rotation.x = -Math.PI / 2; // Rotate to make it horizontal

    this.terrainMesh.scale.set(scaleFactor, scaleFactor, 1);

    // Add the terrain to the scene
    this.scene.add(this.terrainMesh);
  }

  private applyGaussianBlur(heightMap: number[][]): number[][] {
    const width = heightMap.length;
    const height = heightMap[0].length;

    const blurredMap = Array.from({ length: width }, () => Array(height).fill(0));
    const gaussianKernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    const kernelSum = 16; // Sum of all kernel values

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
      // Water: Blue
      color.set('#0000FF');
    }
    else if (height > water && height <= grass) {
      // Interpolate between Blue and Green
      const t = height / grass; // Normalized within 0 to 200
      color.lerpColors(new THREE.Color('#0000FF'), new THREE.Color('#00FF00'), t);
    }
    else if (height > grass && height <= sand) {
      // Interpolate between Green and Yellow
      const t = (height - grass) / (sand - grass); // Normalized within 200 to 400
      color.lerpColors(new THREE.Color('#00FF00'), new THREE.Color('#FFFF00'), t);
    }
    else if (height > sand && height <= rock) {
      // Interpolate between Yellow and Brown
      const t = (height - sand) / (rock - sand); // Normalized within 400 to 600
      color.lerpColors(new THREE.Color('#FFFF00'), new THREE.Color('#8B4513'), t);
    }
    else {
      // Interpolate between Brown and White (Rock to Snow)
      const t = (height - rock) / (snow - rock); // Normalized within 600 to 800
      color.lerpColors(new THREE.Color('#8B4513'), new THREE.Color('#FFFFFF'), t); // White for snow
    }

    return color;
  }



  private animate(): void {
    requestAnimationFrame(() => this.animate());

    // Update controls
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }


  getCellColor(height: number): string {
    if (height === 0) {
      // Water
      return '#0000FF'; // Blue
    } else {
      // Land (non-zero heights)
      return this.heightToColor(height);
    }
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

  interpolateColor(color1: string, color2: string, t: number): string {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    c1.lerp(c2, t); // Interpolate based on t
    return `rgb(${Math.round(c1.r * 255)}, ${Math.round(c1.g * 255)}, ${Math.round(c1.b * 255)})`;
  }


  onCellClick(i: number, j: number): void {
    console.log(`Cell clicked at (${i}, ${j})`);
    this.checkCell(i, j);
  }

  checkCell(i: number, j: number): void {
    const cellHeight = this.islandData?.mapData[i][j];
    console.log(`Cell at (${i}, ${j}) has height ${cellHeight}`);
    // Implement your game logic here
  }
}
