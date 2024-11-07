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

  startGame() {
    this.gameService.getIslandData().subscribe({
      next: (islandData) => {
        console.log("good data")
        console.log(islandData)
        this.router.navigate(['/play'])
      },
      error: (error) => {
        console.error('Error fetching game data:', error);
      }
    });
  }
}
