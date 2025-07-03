import { Component } from '@angular/core';
import { PetsService } from '../../../services/pets.service';
import { CreatePetRequest } from '../../../model/create-pet.request';
import { Router } from '@angular/router';
import {PetFormComponent} from '../../../components/pet-form/pet-form.component';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-pet-create',
  templateUrl: './pet-create.component.html',
  standalone: true,
  imports: [
    PetFormComponent,
    ReactiveFormsModule,
    MatButton
  ],
  styleUrls: ['./pet-create.component.css']
})
export class PetCreateComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder, private petsService: PetsService, private router: Router) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      age: [0, [Validators.required, Validators.min(0)]],
      photo: ['', Validators.required],
      breed: ['', Validators.required],
      size: ['medium', Validators.required],
      description: [''],
      healthStatus: [''],
      vaccinationStatus: [''],
      specialNeeds: ['']
    });
  }

  onCreatePet(): void {
    if (this.form.invalid) return;

    const profileId = Number(localStorage.getItem('profileId'));
    const request = { ...this.form.value, profileId };

    this.petsService.create(request).subscribe({
      next: () => this.router.navigate(['/pets']),
      error: (err) => console.error('Error al registrar mascota:', err),
    });
  }

  goBack(): void {
    this.router.navigate(['/pets']);
  }

}
