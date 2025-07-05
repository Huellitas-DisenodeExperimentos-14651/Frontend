import { Component, inject, OnInit, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdoptionRequestService } from '../../services/adoption-request.service';
import { RequestListComponent } from '../../components/request-list/request-list.component';
import { AdoptionRequest } from '../../model/adoption-request.model';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-adoption-requests-page',
  standalone: true,
  imports: [CommonModule, RequestListComponent, TranslatePipe],
  templateUrl: './adoption-requests.page.html',
  styleUrls: ['./adoption-requests.page.css']
})
export class AdoptionRequestsPage implements OnInit {
  private readonly svc = inject(AdoptionRequestService);
  private readonly i18n = inject(TranslateService);        // ← AÑADIDO

  readonly requests: WritableSignal<AdoptionRequest[]> = signal([]);
  readonly toast    = signal<string | null>(null);

  readonly pending = computed(() =>
    this.requests().filter(r => r.status === 'PENDING')
  );

  readonly history = computed(() =>
    this.requests().filter(r => r.status !== 'PENDING')
  );

  ngOnInit(): void {
    this.svc.getAll().subscribe(reqs => this.requests.set(reqs));
  }

  onDecision(req: AdoptionRequest): void {
    const action$ = req.status === 'APPROVED'
      ? this.svc.approve(req.id)
      : this.svc.reject(req.id);

    action$
      .pipe(
        catchError(() => {
          this.showToast(this.i18n.instant('adoption.toast.error'));
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.requests.update(list =>
          list.map(r => r.id === req.id ? { ...r, status: req.status } : r)
        );

        const key = req.status === 'APPROVED'
          ? 'adoption.toast.approved'
          : 'adoption.toast.rejected';

        this.showToast(this.i18n.instant(key, { id: req.id }));
      });
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 3000);
  }
}
