import { Component, Input, Output, EventEmitter, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdoptionRequest } from '../../model/adoption-request.model';
import { TranslateModule } from '@ngx-translate/core';
import { UserProfileService } from '../../../profile/services/user-profile.service';

// Angular Material imports
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Formato para mostrar fechas como dd/MM/yyyy en el input
const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'dd/MM/yyyy'
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd/MM/yyyy',
    monthYearA11yLabel: 'MMMM yyyy'
  }
};

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule, MatButtonModule, MatIconModule],
  providers: [
    // asegurar que el datepicker use formato/locale español (dd/MM/yyyy en la UI del calendario)
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.css']
})
export class RequestListComponent implements OnDestroy {
  @Input({ required: true }) requests: AdoptionRequest[] = [];
  @Input() isShelter = false; // si true, muestra acciones de refugio
  @Output() select = new EventEmitter<AdoptionRequest>();
  // Nuevo: notificar que el usuario 'vistó' (opened) la solicitud
  @Output() viewed = new EventEmitter<string | number>();

  private readonly userSvc = inject(UserProfileService);

  readonly open = signal<AdoptionRequest | null>(null);
  // temporal para seleccionar fecha antes de emitir
  selectedDate: Date | null = null;
  // nuevo: almacenar hora en formato HH:mm
  selectedTime: string | null = null;
  // nuevos campos para seleccionar hora y minutos con mayor usabilidad
  selectedHour: number | null = null;
  selectedMinute: number | null = null;
  hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  minutes: number[] = [0, 15, 30, 45]; // incrementos de 15 minutos para usabilidad

  minDate: Date = new Date();

  private readonly bodyClass = 'app-modal-open';

  // métodos de ayuda: asignar fecha rápida (0 = hoy, 1 = mañana, 3 = +3 días)
  setQuickDate(daysOffset: number) {
    const now = new Date();
    now.setHours(0,0,0,0);
    now.setDate(now.getDate() + daysOffset);
    this.onDateSelected(now);
  }

  openDetail(r: AdoptionRequest) {
    // marcar como vista si es adoptante y la solicitud tiene entrevista
    try {
      const me = localStorage.getItem('profileId');
      if (!this.isShelter && me && String(r.applicantId) === String(me) && r.status === 'INTERVIEW') {
        this.markInterviewAsSeen(r.id);
        // emitir evento al padre para que actualice contadores
        try { this.viewed.emit(r.id); } catch {}
      }
    } catch {}

    // cargar perfil del solicitante si no está cargado
    if (!r.applicantProfile) {
      // intenta obtener y cachear en el objeto mostrado
      this.userSvc.getProfile(r.applicantId).subscribe({
        next: (u) => {
          // crear copia para no mutar input directo
          const copy = { ...r, applicantProfile: u } as AdoptionRequest;
          this.initDateTimeFromRequest(copy);
          this.open.set(copy);
          // bloquear scroll/interacción detrás
          try { document.body.classList.add(this.bodyClass); } catch {}
        },
        error: () => {
          this.initDateTimeFromRequest(r);
          this.open.set(r);
          try { document.body.classList.add(this.bodyClass); } catch {}
        }
      });
    } else {
      this.initDateTimeFromRequest(r);
      this.open.set(r);
      try { document.body.classList.add(this.bodyClass); } catch {}
    }
  }

  // nuevo: marca en localStorage que la entrevista de una request fue vista
  private markInterviewAsSeen(id: string | number) {
    try {
      const key = 'seenInterviewRequests';
      const raw = localStorage.getItem(key);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const sid = String(id);
      if (!arr.includes(sid)) {
        arr.push(sid);
        localStorage.setItem(key, JSON.stringify(arr));
      }
    } catch {}
  }

  // nuevo: comprueba si la entrevista de una request NO ha sido vista por el usuario
  isInterviewUnseen(id: string | number): boolean {
    try {
      const key = 'seenInterviewRequests';
      const raw = localStorage.getItem(key);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const sid = String(id);
      return !arr.includes(sid);
    } catch {
      return true;
    }
  }

  // Nuevo: inicializa selectedDate, selectedHour, selectedMinute y selectedTime desde la request
  private initDateTimeFromRequest(r: AdoptionRequest) {
    if (r.interviewDate) {
      const dt = new Date(r.interviewDate);
      if (!isNaN(dt.getTime())) {
        this.selectedDate = dt;
        this.selectedHour = dt.getHours();
        this.selectedMinute = dt.getMinutes();
        this.updateSelectedTimeFromParts();
        return;
      }
    }
    // si no hay interviewDate, resetear
    this.selectedDate = null;
    this.selectedHour = null;
    this.selectedMinute = null;
    this.selectedTime = null;
  }

  close() {
    this.open.set(null);
    this.clearSelection();
    try { document.body.classList.remove(this.bodyClass); } catch {}
  }

  // nuevo: limpiar selección de fecha y hora sin cerrar el modal
  clearSelection() {
    this.selectedDate = null;
    this.selectedHour = null;
    this.selectedMinute = null;
    this.selectedTime = null;
  }

  // nuevo: manejador cuando se selecciona fecha en mat-calendar
  onDateSelected(date: Date | null) {
    this.selectedDate = date ? new Date(date) : null;
    // si la fecha trae hora, no sobrescribir hour/minute; si no, mantener lo seleccionado
    if (this.selectedDate && this.selectedHour == null && this.selectedMinute == null) {
      // por defecto dejar 10:00 si no hay hora
      this.selectedHour = 10;
      this.selectedMinute = 0;
    }
    this.updateSelectedTimeFromParts();
  }

  // nuevo: cuando cambian hour/minute en selects
  onTimePartsChanged() {
    if (this.selectedHour == null || this.selectedMinute == null) {
      this.selectedTime = null;
      return;
    }
    const hh = String(this.selectedHour).padStart(2, '0');
    const mm = String(this.selectedMinute).padStart(2, '0');
    this.selectedTime = `${hh}:${mm}`;
  }

  private updateSelectedTimeFromParts() {
    if (this.selectedHour != null && this.selectedMinute != null) {
      const hh = String(this.selectedHour).padStart(2, '0');
      const mm = String(this.selectedMinute).padStart(2, '0');
      this.selectedTime = `${hh}:${mm}`;
    } else if (this.selectedDate) {
      // si tenemos solo Date con hora, extraerla
      const hh = String(this.selectedDate.getHours()).padStart(2, '0');
      const mm = String(this.selectedDate.getMinutes()).padStart(2, '0');
      this.selectedTime = `${hh}:${mm}`;
      this.selectedHour = this.selectedDate.getHours();
      this.selectedMinute = this.selectedDate.getMinutes();
    } else {
      this.selectedTime = null;
    }
  }

  reject(r: AdoptionRequest)  { this.select.emit({ ...r, status: 'REJECTED' }); }

  // programar entrevista: emite status INTERVIEW con interviewDate
  scheduleInterview(r: AdoptionRequest) {
    if (!this.selectedDate || !this.selectedTime) return;
    // convertir Date + time local a ISO
    const [hhStr, mmStr] = this.selectedTime.split(':');
    const hh = Number(hhStr || '0');
    const mm = Number(mmStr || '0');
    const dt = new Date(this.selectedDate);
    dt.setHours(hh, mm, 0, 0);
    const iso = dt.toISOString();
    this.select.emit({ ...r, status: 'INTERVIEW', interviewDate: iso });
    this.close();
  }

  // marcar concretado (COMPLETED)
  complete(r: AdoptionRequest) {
    this.select.emit({ ...r, status: 'COMPLETED' });
  }

  // Limpiar la clase en body al destruir el componente (cumple OnDestroy)
  ngOnDestroy(): void {
    try { document.body.classList.remove(this.bodyClass); } catch {}
  }

  // Formatea ISO date o string a dd/mm/yyyy (sin hora)
  formatDateToDDMMYYYY(date?: string | null): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return String(date);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return String(date);
    }
  }

  // Formatea selectedDate (Date) a dd/mm/yyyy
  formatSelectedDate(): string {
    if (!this.selectedDate) return '';
    try {
      const d = this.selectedDate;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return String(this.selectedDate);
    }
  }

  // nuevo: formatea fecha y hora seleccionadas a "dd/mm/yyyy HH:MM"
  formatSelectedDateTime(): string {
    if (!this.selectedDate) return '';
    const datePart = this.formatSelectedDate();
    const timePart = this.selectedTime || '';
    return timePart ? `${datePart} ${timePart}` : datePart;
  }
}
