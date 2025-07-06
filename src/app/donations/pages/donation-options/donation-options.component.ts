import { Component, OnInit } from '@angular/core';
import { Donation } from '../../model/donation.entity';
import { DonationsService } from '../../services/donations.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DonationCardComponent } from '../../components/donation-card/donation-card.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DonationRecord } from '../../model/donation-record.entity';

type UserRole = 'SHELTER' | 'ADOPTER' | 'RESCUER';

@Component({
  selector: 'app-donation-options',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, DonationCardComponent],
  templateUrl: './donation-options.component.html',
  styleUrls: ['./donation-options.component.css']
})
export class DonationOptionsComponent implements OnInit {
  donations: Donation[] = [];
  allDonationRecords: DonationRecord[] = []; // NUEVA VARIABLE
  userRole: UserRole = 'ADOPTER';
  selectedType: 'monetaria' | 'especie' | null = null;
  showForm: boolean = false;

  constructor(
    private donationService: DonationsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const storedRole = localStorage.getItem('role');
    if (storedRole === 'ADOPTER') this.userRole = 'ADOPTER';
    else if (storedRole === 'SHELTER') this.userRole = 'SHELTER';
    else if (storedRole === 'RESCUER') this.userRole = 'RESCUER';

    this.donationService.getCampaignDonations().subscribe({
      next: (donations: Donation[]) => {
        this.donations = donations;
      },
      error: err => console.error('Error al obtener campañas:', err)
    });

    // Obtener todas las donaciones (para mostrar en la tabla general)
    this.donationService.getAllDonations().subscribe({
      next: (records: DonationRecord[]) => {
        this.allDonationRecords = records;
      },
      error: err => console.error('Error al obtener todas las donaciones:', err)
    });
  }

  goToMonetaryDonations() {
    this.selectedType = 'monetaria';
    this.showForm = true;
  }

  goToPhysicalDonations() {
    this.selectedType = 'especie';
    this.showForm = false;
  }

  resetSelection(): void {
    this.selectedType = null;
    this.showForm = false;
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }
}




