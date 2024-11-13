import {Component, OnInit} from '@angular/core';
import {GameService} from "../../../services/game.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-welcome-screen',
  templateUrl: './welcome-screen.component.html',
  styleUrls: ['./welcome-screen.component.css']
})
export class WelcomeScreenComponent implements OnInit{

  showRules: boolean = false;

  constructor(public gameService: GameService, private router: Router) { }

  ngOnInit(): void {
    this.checkServerConnection();
  }

  startGame2D() {
    if (this.gameService.serverStatus === "offline" || this.gameService.serverStatus === "loading") alert("Game server might be offline currently")
    this.gameService.getIslandData().subscribe({
      next: islandData => this.router.navigate(['/play2d']),
      error: (error) => {
        console.error('Error fetching game data:', error);
      }
    });
  }

  startGame3D() {
    if (this.gameService.serverStatus === "offline" || this.gameService.serverStatus === "loading") alert("Game server might be offline currently")
    this.gameService.getIslandData().subscribe({
      next: islandData => this.router.navigate(['/play3d']),
      error: (error) => {
        console.error('Error fetching game data:', error);
      }
    });
  }

  handleCloseRulesPopup(){
    this.showRules = false
  }


  checkServerConnection() {
    this.gameService.serverStatus = 'loading';
    this.gameService.checkServerConnection()
  }


}
