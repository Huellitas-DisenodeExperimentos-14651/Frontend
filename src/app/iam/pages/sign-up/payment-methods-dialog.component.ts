import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-payment-methods-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatChipsModule
  ],
  templateUrl: './payment-methods-dialog.component.html',
  styleUrls: ['./payment-methods-dialog.component.css']
})
export class PaymentMethodsDialogComponent {
  methods: Array<{ type: string; label?: string; data: any }> = [];

  // controles temporales para los campos del diálogo
  selectedType = new FormControl('YAPE');
  identifierCtrl = new FormControl('', []); // teléfono o identificador genérico

  // campos para tarjeta
  cardNumber = new FormControl('', []);
  cardName = new FormControl('', []);
  cardExpiry = new FormControl('', []);
  cardCvc = new FormControl('', []);

  // bandera para permitir mostrar "Agregar más tarde" (por defecto false)
  allowAddLater: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<PaymentMethodsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { methods?: Array<{ type: string; label?: string; data: any }>, allowAddLater?: boolean }
  ) {
    if (data && Array.isArray(data.methods)) {
      this.methods = data.methods.map(m => ({ ...m }));
    }

    // establecer bandera con valor por defecto false
    this.allowAddLater = !!(data && data.allowAddLater);

    // actualizar validadores según el tipo seleccionado
    this.selectedType.valueChanges.subscribe((type) => {
      if (type === 'TARJETA') {
        this.cardNumber.setValidators([Validators.required]);
        this.cardName.setValidators([Validators.required]);
        this.identifierCtrl.clearValidators();
      } else {
        this.identifierCtrl.setValidators([Validators.required]);
        this.cardNumber.clearValidators();
        this.cardName.clearValidators();
      }
      this.cardNumber.updateValueAndValidity({ onlySelf: true });
      this.cardName.updateValueAndValidity({ onlySelf: true });
      this.identifierCtrl.updateValueAndValidity({ onlySelf: true });
    });
  }

  get canAdd(): boolean {
    const type = this.selectedType.value;
    if (type === 'TARJETA') {
      return !!(this.cardNumber.value && this.cardName.value);
    }
    return !!(this.identifierCtrl.value && String(this.identifierCtrl.value).trim().length > 0);
  }

  addMethod() {
    const type = this.selectedType.value;
    if (!type) return;

    if (type === 'TARJETA') {
      const num = (this.cardNumber.value || '').toString().trim();
      const name = (this.cardName.value || '').toString().trim();
      const expiry = (this.cardExpiry.value || '').toString().trim();
      const cvc = (this.cardCvc.value || '').toString().trim();
      if (!num || !name) return; // mínimo
      const label = `Tarjeta • ${num.slice(-4)}`;
      this.methods.push({ type: 'TARJETA', label, data: { number: num, name, expiry, cvc } });
      // limpiar
      this.cardNumber.setValue('');
      this.cardName.setValue('');
      this.cardExpiry.setValue('');
      this.cardCvc.setValue('');
    } else {
      const id = (this.identifierCtrl.value || '').toString().trim();
      if (!id) return;
      const label = `${type} • ${id}`;
      this.methods.push({ type, label, data: { identifier: id } });
      this.identifierCtrl.setValue('');
    }
  }

  remove(index: number) {
    this.methods.splice(index, 1);
  }

  // nuevo: eliminar por objeto (usado por chips)
  removeMethod(method: { type: string; label?: string; data: any }) {
    const idx = this.methods.indexOf(method);
    if (idx >= 0) this.methods.splice(idx, 1);
  }

  save() {
    this.dialogRef.close(this.methods);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
