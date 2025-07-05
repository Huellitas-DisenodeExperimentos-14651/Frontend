import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdoptionRequest } from '../../model/adoption-request.model';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.css']
})
export class RequestListComponent {
  @Input({ required: true }) requests: AdoptionRequest[] = [];
  @Output() select = new EventEmitter<AdoptionRequest>();

  readonly open = signal<AdoptionRequest | null>(null);

  openDetail(r: AdoptionRequest) {
    this.open.set(r);
  }

  close() {
    this.open.set(null);
  }

  approve(r: AdoptionRequest) { this.select.emit({ ...r, status: 'APPROVED' }); }
  reject(r: AdoptionRequest)  { this.select.emit({ ...r, status: 'REJECTED' }); }
}
