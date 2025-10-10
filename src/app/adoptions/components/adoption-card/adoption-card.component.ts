/**
 * Autor: @leccapedro
 * Descripción: Componente encargado de representar una tarjeta visual
 * con la información de una mascota en adopción. Recibe un objeto `pet`
 * del tipo `Pet` como entrada.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Pet } from '../../../pets/model/pet.entity';

@Component({
  standalone: true,
  selector: 'app-adoption-card',
  templateUrl: './adoption-card.component.html',
  styleUrls: ['./adoption-card.component.css'],
  imports: [CommonModule, RouterModule, TranslateModule]
})
export class AdoptionCardComponent {
  /**
   * Recibe una mascota para mostrar en la tarjeta.
   */
  @Input() pet!: Pet;

  /**
   * Evento que se emite al solicitar la adopción de una mascota.
   */
  @Output() requestAdoption = new EventEmitter<Pet>();

  /**
   * Método para solicitar la adopción de la mascota.
   */
  onRequestAdoption() {
    this.requestAdoption.emit(this.pet);
  }
}
