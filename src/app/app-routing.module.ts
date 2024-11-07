import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {WelcomeScreenComponent} from "./game/welcome-screen/welcome-screen.component";
import {GameScreenComponent} from "./game/game-screen/game-screen.component";

const routes: Routes = [
  {
    path: '',
    component: WelcomeScreenComponent
  },
  {
    path: 'play',
    component: GameScreenComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
