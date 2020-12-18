import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  authCreds;

  constructor(private http: HttpClient) { }

  tryAuth(authVals):Promise<any> {
    return this.http.post<any>('/login', authVals)
      .toPromise()
  }
}
