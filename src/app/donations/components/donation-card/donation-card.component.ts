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
  }

  loadAllDonations(): void {
    this.donationsService.getAllDonations().subscribe({
      next: (data: DonationRecord[]) => {
        this.allDonations = data;
      },
      error: (err) => {
        console.error('Error al cargar todas las donaciones:', err);
      }
    });
  }

  hasDonationRecords(): boolean {
    return this.allDonations.length > 0;
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
      amount: this.amount,
      paymentMethod: this.paymentMethod.toUpperCase(),
      transactionNumber: this.transactionNumber,
      donorName: this.donorName
    };

    this.donationsService.createDonation(donationData).subscribe({
      next: () => {
        alert('Donación registrada correctamente');
        this.showForm = false;
        this.amount = 0;
        this.transactionNumber = '';
        this.donorName = '';
        this.loadAllDonations();
      },
      error: (err) => {
        console.error('Error al registrar donación:', err);
        alert('Ocurrió un error al registrar la donación.');
      }
    });
  }
}


