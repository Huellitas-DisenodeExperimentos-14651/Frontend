import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DonationsService } from '../../services/donations.service';
import { AdoptionsService } from '../../../adoptions/services/adoptions.service';
import { UserProfileService } from '../../../profile/services/user-profile.service';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

type SimplePet = { id: number; name: string; photo?: string };

@Component({
  selector: 'app-donation-options',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './donation-options.component.html',
  styleUrls: ['./donation-options.component.css']
})
export class DonationOptionsComponent implements OnInit {
  pets: SimplePet[] = [];
  selectedPetId: number | null = null;

  // montos
  quickAmounts: number[] = [10, 25, 50, 100];
  selectedAmount: number | null = null;
  customAmount: number | null = null;

  // métodos de pago del usuario
  paymentMethods: string[] = [];
  selectedPaymentMethod: string | null = null;

  loading: boolean = false;
  userProfileId: string | null = null;

  // estado UI
  showHelp: boolean = false;

  constructor(
    private donationsService: DonationsService,
    private adoptionsService: AdoptionsService,
    private userProfileService: UserProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userProfileId = localStorage.getItem('profileId');

    // cargar mascotas disponibles desde adoptions
    this.adoptionsService.getAllPets().subscribe({
      next: (pubs) => {
        // pub may include pet inside
        this.pets = (pubs || []).map((p: any) => ({
          id: Number(p.pet?.id || p.petId || p.id),
          name: p.pet?.name || p.pet?.title || p.title || 'Mascota',
          photo: p.pet?.photo || p.pet?.imageUrl || undefined
        }));
      },
      error: (err) => {
        console.error('Error cargando mascotas disponibles:', err);
      }
    });

    // cargar métodos de pago del perfil
    if (this.userProfileId) {
      this.userProfileService.getProfile(this.userProfileId).subscribe({
        next: (u: any) => {
          this.paymentMethods = u?.paymentMethods || [];
          if (this.paymentMethods.length > 0) this.selectedPaymentMethod = this.paymentMethods[0];
        },
        error: (err) => {
          console.error('Error al obtener perfil:', err);
          this.loadPaymentMethodsFallback();
        }
      });
    } else {
      this.loadPaymentMethodsFallback();
    }
  }

  loadPaymentMethodsFallback(): void {
    // intentar cargar paymentMethods desde localStorage (string CSV o JSON)
    const pm = localStorage.getItem('paymentMethods');
    if (pm) {
      try {
        const parsed = JSON.parse(pm);
        if (Array.isArray(parsed)) {
          this.paymentMethods = parsed as string[];
        } else if (typeof parsed === 'string') {
          this.paymentMethods = parsed.split(',').map(s => s.trim());
        }
      } catch {
        this.paymentMethods = pm.split(',').map(s => s.trim());
      }
    }

    // si sigue vacío, usar opciones por defecto razonables
    if (!this.paymentMethods || this.paymentMethods.length === 0) {
      this.paymentMethods = ['yape', 'plin'];
    }
    if (!this.selectedPaymentMethod) this.selectedPaymentMethod = this.paymentMethods[0];
  }

  selectQuickAmount(a: number) {
    this.selectedAmount = a;
    this.customAmount = null;
  }

  // manejador seguro desde template para evitar errores de tipo
  onCustomAmountInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    const value = target ? target.value : '';
    this.setCustomAmount(value);
  }

  setCustomAmount(value: string) {
    const n = Number(value);
    if (!isNaN(n) && n > 0) {
      this.customAmount = n;
      this.selectedAmount = n;
    } else {
      this.customAmount = null;
      this.selectedAmount = null;
    }
  }

  donate(): void {
    const amount = this.selectedAmount || this.customAmount;
    if (!this.selectedPetId) { alert('Selecciona una mascota.'); return; }
    if (!amount || amount <= 0) { alert('Selecciona o ingresa una cantidad válida.'); return; }
    if (!this.selectedPaymentMethod) { alert('Selecciona un método de pago.'); return; }

    const payload = {
      petId: this.selectedPetId,
      amount,
      paymentMethod: this.selectedPaymentMethod.toUpperCase(),
      donorProfileId: this.userProfileId || null,
      createdAt: new Date().toISOString()
    };

    this.loading = true;
    this.donationsService.createDonation(payload).subscribe({
      next: () => {
        this.loading = false;
        alert(`Gracias por tu aporte de S/.${amount}. ¡Donación registrada!`);
        // reset
        this.selectedPetId = null;
        this.selectedAmount = null;
        this.customAmount = null;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al crear donación:', err);
        alert('Ocurrió un error al procesar la donación.');
      }
    });
  }

  goToProfile(): void {
    this.router.navigate(['/profile']).catch(err => console.error(err));
  }

  // método usado por el template
  toggleHelp(): void {
    this.showHelp = !this.showHelp;
  }
}
