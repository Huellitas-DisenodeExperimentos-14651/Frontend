import { Pipe, PipeTransform } from '@angular/core';
import { Pet } from '../../pets/model/pet.entity';

@Pipe({
  standalone: true,
  name: 'petNameFilter'
})
export class PetNameFilterPipe implements PipeTransform {
  /**
   * Filtra las mascotas según el nombre.
   * Si no se proporciona un nombre, retorna la lista completa.
   *
   * @param pets - Lista de mascotas
   * @param name - Nombre o texto parcial para buscar
   * @returns Lista filtrada por nombre de mascota
   */
  transform(pets: Pet[], name: string): Pet[] {
    if (!name) return pets;

    return pets.filter(pet =>
      pet.name.toLowerCase().includes(name.toLowerCase())
    );
  }
}
