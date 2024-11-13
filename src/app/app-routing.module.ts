import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {WelcomeScreenComponent} from "./game/welcome-screen/welcome-screen.component";
import {GameScreen2DComponent} from "./game/game-screen-2-d/game-screen-2-d.component";
import {GameScreen3DComponent} from "./game/game-screen-3-d/game-screen-3-d.component";

const routes: Routes = [
  {
    path: '',
    component: WelcomeScreenComponent
  },
  {
    path: 'play2d',
    component: GameScreen2DComponent
  },
  {
    path: 'play3d',
    component: GameScreen3DComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
