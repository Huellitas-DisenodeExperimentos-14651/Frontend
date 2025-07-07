import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-pet-form',
  templateUrl: './pet-form.component.html',
  standalone: true,
  imports: [
    MatLabel,
    MatFormField,
    MatSelect,
    ReactiveFormsModule,
    MatOption,
    MatInput,
    MatButton,
  ],
  styleUrls: ['./pet-form.component.css']
})
export class PetFormComponent {
  @Input() form!: FormGroup; // ← el formulario viene desde el componente padre
  @Input() submitLabel: string = 'Registrar Mascota'; // ← botón configurable

  @Output() submitPet = new EventEmitter<void>();

  onSubmit(): void {
    if (this.form.invalid) return;
    this.submitPet.emit();
  }
}
