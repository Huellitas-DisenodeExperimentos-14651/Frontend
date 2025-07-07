import { Pipe, PipeTransform } from '@angular/core';
import { PublicationWithPet } from '../model/publication-with-pet.model';

@Pipe({
  standalone: true,
  name: 'petNameFilter'
})
export class PetNameFilterPipe implements PipeTransform {
  /**
   * Filtra las publicaciones según el nombre de la mascota asociada.
   * Si no se proporciona un nombre, retorna la lista completa.
   *
   * @param publications - Lista de publicaciones con mascota
   * @param name - Nombre o texto parcial para buscar
   * @returns Lista filtrada por nombre de mascota
   */
  transform(publications: PublicationWithPet[], name: string): PublicationWithPet[] {
    if (!name) return publications;

    return publications.filter(pub =>
      pub.pet.name.toLowerCase().includes(name.toLowerCase())
    );
  }
}
