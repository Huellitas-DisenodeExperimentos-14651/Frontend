/**
 * Autor: @leccapedro
 * Descripción: Modelo que representa los criterios de filtrado para el listado de mascotas en adopción.
 * Cada propiedad es opcional y corresponde a un filtro disponible en la interfaz del usuario.
 */

export interface AdoptionFilter {
  age?: 'Cachorro' | 'Adulto' | 'Mayor';
  size?: 'SMALL' | 'MEDIUM' | 'LARGE';
}
