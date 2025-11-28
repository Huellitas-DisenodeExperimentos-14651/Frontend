import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { DonationsService } from '../../services/donations.service';
import { DonationRecord } from '../../model/donation-record.entity';
import { Donation } from '../../model/donation.entity';

@Component({
  selector: 'app-donation-card',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './donation-card.component.html',
  styleUrls: ['./donation-card.component.css']
})
export class DonationCardComponent implements OnInit {
  @Input() donation!: Donation;
  @Input() userRole: 'SHELTER' | 'ADOPTER' | 'RESCUER' = 'ADOPTER';
  @Input() showDonateButton: boolean = true;
  @Input() isPhysical: boolean = false;

  showForm: boolean = false;
  amount: number = 0;
  paymentMethod: string = 'yape';
  transactionNumber: string = '';
  donorName: string = '';

  allDonations: DonationRecord[] = [];

  constructor(private donationsService: DonationsService) {}

  ngOnInit(): void {
    this.loadAllDonations();

    // Si la entidad trae un monto preseleccionado (señal desde la lista), lo tomamos
    const preset = (this.donation as any).__presetAmount;
    if (preset && Number(preset) > 0) {
      this.amount = Number(preset);
      this.showForm = true; // abrir directamente el formulario
    }
  }

  loadAllDonations(): void {
    this.donationsService.getAllDonations().subscribe({
      next: (data: DonationRecord[]) => {
        this.allDonations = data || [];
      },
      error: (err) => {
        console.error('Error al cargar todas las donaciones:', err);
      }
    });
  }

  getYapeNumber(contactInfo: string | undefined): string {
    if (!contactInfo) return '';
    const parts = contactInfo.toString().split('-');
    return parts[0].replace('Yape:', '').trim();
  }

  cleanContactInfo(info: string): string {
    if (!info) return '';
    const emailMatch = info.match(/[\w.-]+@[\w.-]+\.\w+/);
    return emailMatch ? emailMatch[0] : info;
  }

  cleanAddress(address: any): string {
    if (!address) return '';
    const str = address.toString();
    const match = str.match(/value=(.*?)]/);
    return match ? match[1] : str;
  }

  // progreso relativo de la campaña: 0..100
  getProgressPercent(): number {
    const goal = (this.donation as any).goal || 0;
    const collected = (this.donation as any).collected || 0;
    if (!goal || goal <= 0) return 0;
    const p = Math.round((collected / goal) * 100);
    return Math.min(100, Math.max(0, p));
  }

  // texto amigable de meta
  formattedGoal(): string {
    const goal = (this.donation as any).goal;
    return goal ? `S/. ${goal}` : '-';
  }

  confirmDonation(): void {
    if (
      !this.amount || this.amount <= 0 ||
      !this.paymentMethod ||
      !this.transactionNumber.trim() ||
      !this.donorName.trim() || this.donorName.length < 2
    ) {
      alert('Por favor completa todos los campos correctamente.');
      return;
    }

    const donationData = {
      campaignId: (this.donation as any).id || null,
      amount: this.amount,
      paymentMethod: this.paymentMethod.toUpperCase(),
      transactionNumber: this.transactionNumber,
      donorName: this.donorName,
      createdAt: new Date().toISOString()
    };

    this.donationsService.createDonation(donationData).subscribe({
      next: () => {
        alert('Donación registrada correctamente');
        this.showForm = false;
        this.amount = 0;
        this.transactionNumber = '';
        this.donorName = '';
        // recargar registros y, opcionalmente, notificar al servidor para actualizar campaña
        this.loadAllDonations();
      },
      error: (err) => {
        console.error('Error al registrar donación:', err);
        alert('Ocurrió un error al registrar la donación.');
      }
    });
  }
}
