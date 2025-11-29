import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicationsService, CreatePublicationPayload } from '../../services/publications.service';
import { TranslatePipe } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { PetsService } from '../../../pets/services/pets.service';
import { combineLatest, Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

@Component({
  selector: 'app-create-publication-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    TranslatePipe
  ],
  templateUrl: './create-publication-dialog.component.html',
  styleUrls: ['./create-publication-dialog.component.css']
})
export class CreatePublicationDialogComponent {
  private fb = inject(FormBuilder);
  private pubs = inject(PublicationsService);
  private dialogRef = inject(MatDialogRef<CreatePublicationDialogComponent>);
  private petsService = inject(PetsService);
  private data = inject(MAT_DIALOG_DATA, { optional: true }) as { petId?: any } | null;

  pets$!: Observable<any[]>;
  selectedPet$!: Observable<any | null>;

  form = this.fb.group({
    petId: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', Validators.maxLength(1000)],
    photo: ['']
  });

  submitting = false;

  constructor() {
    // cargar lista de mascotas (para selección en el dialog)
    this.pets$ = this.petsService.getAll();

    // Exponer la mascota seleccionada como observable (sin imágenes, sólo nombre)
    this.selectedPet$ = combineLatest([
      this.pets$,
      this.form.get('petId')!.valueChanges.pipe(startWith(this.form.get('petId')!.value))
    ]).pipe(
      map(([pets, petId]) => (pets || []).find((p: any) => String(p.id) === String(petId)) || null)
    );

    // si viene petId en data, prefijar
    if (this.data?.petId) {
      this.form.patchValue({ petId: this.data.petId });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;

    const ownerId = localStorage.getItem('profileId') ?? undefined;
    const raw = this.form.value;

    // coercionar tipos seguros (petId viene del mat-select)
    const petIdRaw = raw.petId;
    const petIdNum = typeof petIdRaw === 'number' ? petIdRaw : Number(petIdRaw);

    // si petId no es un número válido, marcar el control como inválido y abortar
    if (Number.isNaN(petIdNum)) {
      const ctrl = this.form.get('petId');
      ctrl?.setErrors({ invalidPetId: true });
      this.submitting = false;
      return;
    }

    const titleRaw = raw.title;
    const descriptionRaw = raw.description;
    const photoRaw = raw.photo;

    const payload: CreatePublicationPayload = {
      petId: petIdNum,
      title: (titleRaw ?? '') as string,
      description: (descriptionRaw ?? '') as string,
      photo: photoRaw ? String(photoRaw) : undefined,
      ownerId: ownerId,
      publishedAt: new Date().toISOString(),
      isActive: true,
      contactInfo: localStorage.getItem('username') || 'contact@example.com',
      location: 'Sede'
    };

    this.pubs.create(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.dialogRef.close(true);
      },
      error: () => {
        this.submitting = false;
        this.dialogRef.close(false);
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
