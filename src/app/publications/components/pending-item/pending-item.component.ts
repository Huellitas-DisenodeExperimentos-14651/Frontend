import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pet } from '../../../pets/model/pet.entity';
import {TranslatePipe} from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-pending-item',
  standalone: true,
  templateUrl: './pending-item.component.html',
  styleUrls: ['./pending-item.component.css'],
  imports: [CommonModule, TranslatePipe, MatButtonModule]
})
export class PendingItemComponent {
  @Input() pet!: Pet;
  @Output() publish = new EventEmitter<void>();
}
