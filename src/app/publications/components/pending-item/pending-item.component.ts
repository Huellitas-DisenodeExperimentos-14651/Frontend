import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pet } from '../../../pets/model/pet.entity';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-pending-item',
  standalone: true,
  templateUrl: './pending-item.component.html',
  styleUrls: ['./pending-item.component.css'],
  imports: [CommonModule, TranslatePipe]
})
export class PendingItemComponent {
  @Input() pet!: Pet;
  @Output() publish = new EventEmitter<void>();
}
