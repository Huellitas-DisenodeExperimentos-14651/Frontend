import { Publication } from './publication';
import { Pet } from '../../pets/model/pet.entity';

export interface PublicationWithPet extends Publication {
  pet: Pet;
}
