import { Component, inject, OnInit, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdoptionRequestService } from '../../services/adoption-request.service';
import { RequestListComponent } from '../../components/request-list/request-list.component';
import { AdoptionRequest } from '../../model/adoption-request.model';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PublicationsService } from '../../../publications/services/publications.service';
import { PetsService } from '../../../pets/services/pets.service';

@Component({
  selector: 'app-adoption-requests-page',
  standalone: true,
  imports: [CommonModule, RequestListComponent, TranslatePipe],
  templateUrl: './adoption-requests.page.html',
  styleUrls: ['./adoption-requests.page.css']
})
export class AdoptionRequestsPage implements OnInit {
  private readonly svc = inject(AdoptionRequestService);
  private readonly i18n = inject(TranslateService);
  private readonly pubs = inject(PublicationsService);
  private readonly petsSvc = inject(PetsService);

  readonly requests: WritableSignal<AdoptionRequest[]> = signal([]);
  readonly toast    = signal<string | null>(null);

  // indicar si el usuario es un refugio
  readonly isShelter = signal<boolean>(false);

  readonly pending = computed(() =>
    this.requests().filter(r => r.status === 'PENDING')
  );

  readonly history = computed(() =>
    this.requests().filter(r => r.status !== 'PENDING')
  );

  ngOnInit(): void {
    const role = localStorage.getItem('role');
    const profileId = localStorage.getItem('profileId');
    const asShelter = role === 'SHELTER';
    this.isShelter.set(asShelter);

    if (asShelter && profileId) {
      // obtener publicaciones del refugio y luego filtrar solicitudes pertenecientes
      this.pubs.getByOwner(profileId).subscribe({
        next: (publications) => {
          const pubIds = publications.map(p => String((p as any).id));
          const petIds = publications.map(p => String((p as any).petId));

          // obtener todas las mascotas para enriquecer
          this.petsSvc.getAll().subscribe({
            next: (pets) => {
              this.svc.getAll().subscribe({
                next: (reqs) => {
                  // filtrar por publicaciones del refugio
                  const filtered = reqs.filter(r => pubIds.includes(String(r.publicationId)));
                  // enriquecer con la mascota asociada (buscar por petId desde publications)
                  const enriched = filtered.map(r => {
                    const pub = publications.find((p: any) => String(p.id) === String(r.publicationId));
                    const pet = pub ? pets.find(p => String(p.id) === String(pub.petId)) : undefined;
                    return { ...r, pet } as AdoptionRequest;
                  });
                  this.requests.set(enriched);
                },
                error: () => {
                  this.requests.set([]);
                }
              });
            },
            error: () => {
              // si no podemos cargar mascotas, igual filtramos por publication ids sin pet
              this.svc.getAll().subscribe({
                next: (reqs) => {
                  const filtered = reqs.filter(r => pubIds.includes(String(r.publicationId)));
                  this.requests.set(filtered);
                },
                error: () => this.requests.set([])
              });
            }
          });
        },
        error: () => {
          // si fallo en obtener publicaciones, no mostrar nada
          this.requests.set([]);
        }
      });

    } else {
      // usuario normal: cargar todas las solicitudes (vista de adoptante)
      this.svc.getAll().subscribe(reqs => this.requests.set(reqs));
    }
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
        if (updated.pet && updated.pet.id) {
          const petStatus = updated.status === 'INTERVIEW' ? 'interview' :
                            updated.status === 'COMPLETED' ? 'adopted' : undefined;
          if (petStatus) {
            // actualizar pet en backend para que aparezca en el filtro correspondiente
            this.petsSvc.update(Number(updated.pet.id), { status: petStatus } as any).subscribe({
              next: () => {
                // actualizar listado local si la mascota está presente
                this.requests.update(list =>
                  list.map(r => r.id === updated.id ? { ...r, status: updated.status, interviewDate: updated.interviewDate, pet: { ...r.pet!, status: petStatus } } as AdoptionRequest : r)
                );
              },
              error: () => {
                // ignorar fallo en actualizar pet, ya mostramos el toast principal
              }
            });
          } else {
            // solo actualizar estado de la solicitud en la lista
            this.requests.update(list =>
              list.map(r => r.id === updated.id ? { ...r, status: updated.status, interviewDate: updated.interviewDate } as AdoptionRequest : r)
            );
          }
        } else {
          // actualizar solo la solicitud en el listado
          this.requests.update(list =>
            list.map(r => r.id === updated.id ? { ...r, status: updated.status, interviewDate: updated.interviewDate } as AdoptionRequest : r)
          );
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
