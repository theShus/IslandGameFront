import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WelcomeScreenComponent } from './game/welcome-screen/welcome-screen.component';
import {HttpClientModule} from "@angular/common/http";
import { GameScreenComponent } from './game/game-screen/game-screen.component';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeScreenComponent,
    GameScreenComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
