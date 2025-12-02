import { Component, inject, OnInit, OnDestroy, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdoptionRequestService } from '../../services/adoption-request.service';
import { RequestListComponent } from '../../components/request-list/request-list.component';
import { AdoptionRequest } from '../../model/adoption-request.model';
import { EMPTY, Subscription, interval } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PetsService } from '../../../pets/services/pets.service';

@Component({
  selector: 'app-adoption-requests-page',
  standalone: true,
  imports: [CommonModule, RequestListComponent, TranslatePipe],
  templateUrl: './adoption-requests.page.html',
  styleUrls: ['./adoption-requests.page.css']
})
export class AdoptionRequestsPage implements OnInit, OnDestroy {
  private readonly svc = inject(AdoptionRequestService);
  private readonly i18n = inject(TranslateService);
  private readonly petsSvc = inject(PetsService);

  readonly requests: WritableSignal<AdoptionRequest[]> = signal([]);
  readonly toast    = signal<string | null>(null);

  // indicar si el usuario es un refugio
  readonly isShelter = signal<boolean>(false);

  readonly pending = computed(() =>
    this.requests().filter(r => r.status === 'PENDING')
  );

  // solicitudes que ya tienen entrevista agendada
  readonly interview = computed(() =>
    this.requests().filter(r => r.status === 'INTERVIEW')
  );

  readonly history = computed(() =>
    // historial: excluir pendientes e entrevistas agendadas
    this.requests().filter(r => r.status !== 'PENDING' && r.status !== 'INTERVIEW')
  );

  // Nuevo: ids de entrevistas que el adoptante ya vio (persistidos en localStorage)
  readonly seenIds = signal<string[]>([]);

  // Nuevo: contador reactivo de entrevistas no vistas
  readonly unseenInterviewCount = computed(() => {
    const seen = new Set(this.seenIds());
    return this.interview().filter(r => !seen.has(String(r.id))).length;
  });

  private subs = new Subscription();
  private currentProfileId: string | null = null;

  ngOnInit(): void {
    const role = localStorage.getItem('role');
    const profileId = localStorage.getItem('profileId');
    const asShelter = role === 'SHELTER';
    this.isShelter.set(asShelter);
    this.currentProfileId = profileId;

    // cargar seenIds desde localStorage
    try {
      const raw = localStorage.getItem('seenInterviewRequests');
      const arr: string[] = raw ? JSON.parse(raw) : [];
      this.seenIds.set(arr);
    } catch {
      this.seenIds.set([]);
    }

    if (asShelter && profileId) {
      this.loadRequestsForShelter(profileId);

      // suscribirse a cambios en las solicitudes para recargar automáticamente
      this.subs.add(this.svc.requestsChanged.subscribe(() => {
        this.loadRequestsForShelter(profileId);
      }));

      // también suscribirse a cambios en mascotas por si se actualiza estado
      this.subs.add(this.petsSvc.petsChanged.subscribe(() => {
        this.loadRequestsForShelter(profileId);
      }));

      // polling cada 5 segundos para detectar solicitudes creadas desde otros clientes
      this.subs.add(interval(5000).subscribe(() => this.loadRequestsForShelter(profileId)));

    } else {
      // usuario normal: cargar SOLO sus propias solicitudes (vista de adoptante)
      if (profileId) {
        this.loadRequestsForAdopter(profileId);

        // refrescar cuando hay cambios en solicitudes o mascotas
        this.subs.add(this.svc.requestsChanged.subscribe(() => this.loadRequestsForAdopter(profileId)));
        this.subs.add(this.petsSvc.petsChanged.subscribe(() => this.loadRequestsForAdopter(profileId)));

        // polling cada 5s para detectar cambios externos
        this.subs.add(interval(5000).subscribe(() => this.loadRequestsForAdopter(profileId)));
      } else {
        // sin profileId no podemos filtrar por solicitante, cargar todo como fallback
        this.svc.getAll().subscribe(reqs => this.requests.set(reqs));

        this.subs.add(this.svc.requestsChanged.subscribe(() => {
          this.svc.getAll().subscribe(reqs => this.requests.set(reqs));
        }));
      }
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // Nuevo: manejar evento cuando un RequestListComponent emite que se vio una entrevista
  onViewed(id: string | number) {
    try {
      const sid = String(id);
      const arr = [...this.seenIds()];
      if (!arr.includes(sid)) {
        arr.push(sid);
        this.seenIds.set(arr);
        localStorage.setItem('seenInterviewRequests', JSON.stringify(arr));
      }
    } catch {}
  }

  private loadRequestsForShelter(profileId: string) {
    // Obtener las mascotas del refugio y filtrar las solicitudes que correspondan
    this.petsSvc.getByProfileId(profileId).subscribe({
      next: (pets) => {
        const petIds = pets.map(p => String((p as any).id));

        // obtener todas las solicitudes y filtrar las que pertenezcan al refugio
        this.svc.getAll().subscribe({
          next: (reqs) => {
            const filtered = reqs.filter(r => {
              // incluir si ownerId coincide (cuando se guardó) o si referencia la mascota (petId o legacy publicationId)
              const ownerMatch = String(r.ownerId ?? '') === String(profileId);
              const refId = String(r.petId ?? r.publicationId ?? '');
              const petMatch = refId && petIds.includes(refId);
              return ownerMatch || petMatch;
            });

            // enriquecer cada solicitud con la mascota asociada (si existe)
            const enriched = filtered.map(r => {
              const refId = r.petId ?? r.publicationId ?? undefined;
              const pet = refId ? pets.find(p => String((p as any).id) === String(refId)) : undefined;
              return { ...r, pet } as AdoptionRequest;
            });

            this.requests.set(enriched);
          },
          error: () => this.requests.set([])
        });
      },
      error: () => {
        // si no podemos cargar mascotas, intentar filtrar por ownerId solamente
        this.svc.getAll().subscribe({
          next: (reqs) => {
            const filtered = reqs.filter(r => String(r.ownerId ?? '') === String(profileId));
            this.requests.set(filtered);
          },
          error: () => this.requests.set([])
        });
      }
    });
  }

  // Nuevo: cargar las solicitudes del adoptante (applicantId === profileId) y enriquecer con mascota si existe
  private loadRequestsForAdopter(profileId: string) {
    this.svc.getAll().subscribe({
      next: (reqs) => {
        const filtered = reqs.filter(r => String(r.applicantId) === String(profileId));
        if (!filtered.length) {
          this.requests.set([]);
          return;
        }

        // intentar cargar todas las mascotas para enriquecer los requests de forma eficiente
        this.petsSvc.getAll().subscribe({
          next: (pets) => {
            const enriched = filtered.map(r => {
              const refId = r.petId ?? r.publicationId ?? undefined;
              const pet = refId ? pets.find(p => String((p as any).id) === String(refId)) : undefined;
              return { ...r, pet } as AdoptionRequest;
            });
            this.requests.set(enriched);
          },
          error: () => {
            // si no podemos cargar mascotas, devolver sólo las solicitudes filtradas
            this.requests.set(filtered);
          }
        });
      },
      error: () => this.requests.set([])
    });
  }

  onDecision(req: AdoptionRequest): void {
    // Patch con status y posible interviewDate
    const patch: Partial<AdoptionRequest> = { status: req.status };
    if (req.interviewDate) patch.interviewDate = req.interviewDate;

    this.svc.patch(req.id, patch)
      .pipe(
        catchError(() => {
          this.showToast(this.i18n.instant('adoption.toast.error'));
          return EMPTY;
        })
      )
      .subscribe((updated) => {
        // Si la solicitud tiene pet, actualizar su estado según la nueva solicitud
        // Determinar petId (buscar en varios lugares para mayor robustez)
        const local = this.requests().find(r => String(r.id) === String(updated.id));
        const petCandidate = updated as any;
        // mantener el id tal cual (string o number) porque en db.json los ids pueden ser alfanuméricos
        const petIdRaw = petCandidate.pet?.id ?? (petCandidate.petId ?? petCandidate.publicationId) ?? (local?.pet?.id ?? local?.petId ?? local?.publicationId);
        const petId = petIdRaw != null ? petIdRaw : undefined;

        const petStatus = updated.status === 'INTERVIEW' ? 'interview' :
                          updated.status === 'COMPLETED' ? 'adopted' : undefined;

        // Actualización optimista: reflejar el nuevo estado de la solicitud (y de la mascota, si aplica)
        this.requests.update(list =>
          list.map(r => r.id === updated.id
            ? ({ ...r, status: updated.status, interviewDate: updated.interviewDate, ...(petStatus && r.pet ? { pet: { ...r.pet!, status: petStatus } } : {}) } as AdoptionRequest)
            : r
          )
        );

        if (petStatus && petId != null) {
          // actualizar pet en backend para que aparezca en el filtro correspondiente
          // petsSvc.update acepta id string|number; usar petId tal cual (evita NaN para ids alfanuméricos)
          this.petsSvc.update(petId, { status: petStatus } as any).subscribe({
             next: () => {
               // ya aplicamos la actualización optimista; reforzar notificación global
               try { this.petsSvc.notifyChange(); } catch {}
             },
             error: () => {
               // si falla la actualización de la mascota, revertir el estado de la mascota local si existía
               this.requests.update(list =>
                 list.map(r => r.id === updated.id ? ({ ...r, ...(r.pet ? { pet: { ...r.pet!, status: r.pet!.status } } : {}) } as AdoptionRequest) : r)
               );
               try { this.petsSvc.notifyChange(); } catch {}
             }
           });
         } else {
           // ya aplicamos la actualización optimista arriba
         }

        const key = updated.status === 'APPROVED'
          ? 'adoption.toast.approved'
          : updated.status === 'REJECTED'
            ? 'adoption.toast.rejected'
            : updated.status === 'INTERVIEW'
              ? 'adoption.toast.interviewScheduled'
              : updated.status === 'COMPLETED'
                ? 'adoption.toast.completed'
                : 'adoption.toast.updated';

        this.showToast(this.i18n.instant(key, { id: updated.id, date: updated.interviewDate }));
      });
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 3000);
  }
}
