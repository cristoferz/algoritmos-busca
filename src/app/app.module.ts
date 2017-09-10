import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MdSidenavModule, MdToolbarModule, MdSelectModule, MdListModule, MdAutocompleteModule, MdInputModule, MdButtonModule, MdCheckboxModule } from "@angular/material";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MdSidenavModule,
    MdToolbarModule,
    MdSelectModule,
    MdListModule,
    MdAutocompleteModule,
    FormsModule,
    MdInputModule,
    MdButtonModule,
    MdCheckboxModule,
    BrowserAnimationsModule
  ],
  exports: [
    MdSidenavModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
