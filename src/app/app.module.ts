import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WelcomeScreenComponent } from './game/welcome-screen/welcome-screen.component';
import {HttpClientModule} from "@angular/common/http";
import { GameScreen2DComponent } from './game/game-screen-2-d/game-screen-2-d.component';
import { GameScreen3DComponent } from './game/game-screen-3-d/game-screen-3-d.component';
import { GameOverPopupComponent } from './game/game-over-popup/game-over-popup.component';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeScreenComponent,
    GameScreen2DComponent,
    GameScreen3DComponent,
    GameOverPopupComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
