import {Component, OnInit} from '@angular/core';
import {IslandData} from "../../../models/models";
import {GameService} from "../../../services/game.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.css']
})
export class GameScreenComponent implements OnInit{

  islandData?: IslandData

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
        this.islandData = data;
      }
      else {
        const storedData = localStorage.getItem("islandData")
        if (storedData) { this.islandData = JSON.parse(storedData) }
        else {
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

}
