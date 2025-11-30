import { Injectable } from '@angular/core';
import { Donation } from '../model/donation.entity';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpHeaders } from '@angular/common/http';
import { DonationRecord } from '../model/donation-record.entity';


@Injectable({
  providedIn: 'root',
})
export class DonationsService {
  private apiUrl: string = `${environment.serverBasePath}/donations`;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    })
  };

  constructor(private http: HttpClient) {}

  getAllDonations(): Observable<DonationRecord[]> {
    return this.http.get<DonationRecord[]>(this.apiUrl);
  }

  getCampaignDonations(): Observable<Donation[]> {
    return this.http.get<Donation[]>(`${this.apiUrl}/campaigns`);
  }

  createDonation(donationData: any): Observable<any> {
    // If using the serverless read-only API (/api -> Netlify Function), mock the response to avoid runtime errors
    if (environment.serverBasePath === '/api') {
      console.warn('Running in read-only serverless mode: donation will be mocked');
      const mock = Object.assign({ id: `mock-${Date.now()}`, status: 'PENDING' }, donationData);
      return of(mock);
    }

    return this.http.post(`${this.apiUrl}`, donationData);
  }


}
