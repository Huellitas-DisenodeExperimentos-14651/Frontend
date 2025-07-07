/**
 * Autor: @leccapedro
 * Descripción: Componente encargado de representar una tarjeta visual
 * con la información de una mascota en adopción. Recibe un objeto `pet`
 * del tipo `Pet` como entrada.
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Pet } from '../../../pets/model/pet.entity';
import { PublicationWithPet } from '../../model/publication-with-pet.model'; // Asegúrate de usar el path correcto

@Component({
  standalone: true,
  selector: 'app-adoption-card',
  templateUrl: './adoption-card.component.html',
  styleUrls: ['./adoption-card.component.css'],
  imports: [CommonModule, RouterModule, TranslateModule]
})
export class AdoptionCardComponent {
  /**
   * Recibe una publicación con mascota para mostrar en la tarjeta.
   */
  @Input() publication!: PublicationWithPet;
}
