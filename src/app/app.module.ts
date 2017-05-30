import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppRouterModule } from './app-router/module';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/component';
import { FooterComponent } from './footer/component';
import { ConstantsService } from './services/constants';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRouterModule,
  ],
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent
  ],
  providers: [
    ConstantsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
