import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PetsService } from '../../../services/pets.service';
import { Pet } from '../../../model/pet.entity';
import { PetFormComponent } from '../../../components/pet-form/pet-form.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-pet-edit',
  standalone: true,
  templateUrl: './pet-edit.component.html',
  styleUrls: ['./pet-edit.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PetFormComponent,
    MatButton
  ]
})
export class PetEditComponent implements OnInit {
  petId!: number;
  form!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private petsService: PetsService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.petId = Number(this.route.snapshot.paramMap.get('id'));
    this.form = this.fb.group({
      name: [''],
      age: [0],
      photo: [''],
      breed: [''],
      size: ['medium'],
      description: [''],
      healthStatus: [''],
      vaccinationStatus: [''],
      specialNeeds: ['']
    });

    this.petsService.getById(this.petId).subscribe({
      next: (pet) => this.form.patchValue(pet),
      error: (err) => console.error('Error al cargar mascota', err)
    });
  }

  onUpdatePet(): void {
    if (this.form.invalid) return;

    this.petsService.update(this.petId, this.form.value).subscribe({
      next: () => this.router.navigate(['/pets']),
      error: (err) => console.error('Error al actualizar mascota', err)
    });
  }

  goBack(): void {
    this.router.navigate(['/pets']);
  }
}
