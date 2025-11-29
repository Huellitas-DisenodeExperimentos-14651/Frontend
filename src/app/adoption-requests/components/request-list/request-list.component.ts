import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdoptionRequest } from '../../model/adoption-request.model';
import {TranslatePipe} from '@ngx-translate/core';
import { UserProfileService } from '../../../profile/services/user-profile.service';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.css']
})
export class RequestListComponent {
  @Input({ required: true }) requests: AdoptionRequest[] = [];
  @Input() isShelter = false; // si true, muestra acciones de refugio
  @Output() select = new EventEmitter<AdoptionRequest>();

  private readonly userSvc = inject(UserProfileService);

  readonly open = signal<AdoptionRequest | null>(null);
  // temporal para seleccionar fecha antes de emitir
  selectedDate: string | null = null;

  openDetail(r: AdoptionRequest) {
    // cargar perfil del solicitante si no está cargado
    if (!r.applicantProfile) {
      // intenta obtener y cachear en el objeto mostrado
      this.userSvc.getProfile(r.applicantId).subscribe({
        next: (u) => {
          // crear copia para no mutar input directo
          const copy = { ...r, applicantProfile: u } as AdoptionRequest;
          this.open.set(copy);
        },
        error: () => {
          // aunque falle, mostrar detalle mínimo
          this.open.set(r);
        }
      });
    } else {
      this.open.set(r);
    }
  }

  close() {
    this.open.set(null);
    this.selectedDate = null;
  }

  approve(r: AdoptionRequest) { this.select.emit({ ...r, status: 'APPROVED' }); }
  reject(r: AdoptionRequest)  { this.select.emit({ ...r, status: 'REJECTED' }); }

  // programar entrevista: emite status INTERVIEW con interviewDate
  scheduleInterview(r: AdoptionRequest) {
    if (!this.selectedDate) return;
    const iso = new Date(this.selectedDate).toISOString();
    this.select.emit({ ...r, status: 'INTERVIEW', interviewDate: iso });
    this.close();
  }

  // marcar concretado (COMPLETED)
  complete(r: AdoptionRequest) {
    this.select.emit({ ...r, status: 'COMPLETED' });
  }
}
