import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.css']
})
export class RulesComponent {

  @Input() show: boolean = false;

  @Output() closePopup = new EventEmitter<void>();

  closePopupFun() {
    this.closePopup.emit();
  }
}
