import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-game-over-popup',
  templateUrl: './game-over-popup.component.html',
  styleUrls: ['./game-over-popup.component.css']
})
export class GameOverPopupComponent {

  @Output() restart = new EventEmitter<void>();
  @Output() quit = new EventEmitter<void>();

  @Input() isVictory: boolean = false;
  @Input() playerLives: number = 2;

  restartGame() {
    this.restart.emit();
  }

  quitGame() {
    this.quit.emit();
  }

  getStarsArray(): boolean[] {
    const maxLives = 3;
    const starsArray = Array(this.playerLives).fill(true); // Lives remaining as gold stars
    const grayArray = Array(maxLives - this.playerLives).fill(false); // Missing lives as gray stars
    return [...starsArray, ...grayArray];
  }
}
