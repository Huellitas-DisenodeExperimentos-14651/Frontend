import { Injectable } from '@angular/core';
import { Donation } from '../model/donation.entity';
import { Observable, map } from 'rxjs';
import { DonationRecord } from '../model/donation-record.entity';
import { NetlifyDbService } from '../../shared/services/netlify-db.service';


@Injectable({
  providedIn: 'root',
})
export class DonationsService {

  constructor(private netlifyDb: NetlifyDbService) {}

  /** Obtener todos los registros de donaciones (DonationRecord) */
  getAllDonations(): Observable<DonationRecord[]> {
    // Se asume que los registros están en la colección 'donation-records'.
    return this.netlifyDb.getCollection('donation-records') as Observable<DonationRecord[]>;
  }

  /** Obtener campañas/solicitudes de donación */
  getCampaignDonations(): Observable<Donation[]> {
    // Las campañas se almacenan en la colección 'donations'
    return this.netlifyDb.getCollection('donations') as Observable<Donation[]>;
  }

  /** Crear una nueva campaña o registro de donación */
  createDonation(donationData: any): Observable<any> {
    // Si el payload declara ser un record, lo guardamos en 'donation-records',
    // en caso contrario asumimos que es una campaña y lo guardamos en 'donations'.
    const collection = (donationData && donationData.donationId) ? 'donation-records' : 'donations';
    const id = donationData && donationData.id ? String(donationData.id) : `${collection}_${Date.now()}`;
    const payload = { ...donationData, id };
    return this.netlifyDb.mutate('create', collection, payload).pipe(map(() => payload));
  }


}
