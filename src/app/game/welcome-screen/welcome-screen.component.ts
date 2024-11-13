import { Component } from '@angular/core';
import {GameService} from "../../../services/game.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-welcome-screen',
  templateUrl: './welcome-screen.component.html',
  styleUrls: ['./welcome-screen.component.css']
})
export class WelcomeScreenComponent {

  constructor(private gameService: GameService, private router: Router) { }

  startGame2D() {
    this.gameService.getIslandData().subscribe({
      next: islandData => this.router.navigate(['/play2d']),
      error: (error) => {
        console.error('Error fetching game data:', error);
      }
    });
  }

  startGame3D() {
    this.gameService.getIslandData().subscribe({
      next: islandData => this.router.navigate(['/play3d']),
      error: (error) => {
        console.error('Error fetching game data:', error);
      }
    });
  }
}
