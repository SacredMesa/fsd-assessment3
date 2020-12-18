import {Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  errorMessage = 'Username or Password is Incorrect'

  loginForm: FormGroup

  constructor(private fb: FormBuilder, private http: HttpClient) {
  }

  ngOnInit(): void {
    this.loginForm = this.createLogin()
  }

  private createLogin(): FormGroup {
    return this.fb.group({
      username: this.fb.control('', [Validators.required]),
      password: this.fb.control('', [Validators.required]),
    })
  }

  attemptLogin() {
    console.info('form = ', this.loginForm.value)
    const value = this.loginForm.value

    // fill in the form
    let params = new HttpParams()
    params = params.set('username', value['username'])
    params = params.set('password', value['password'])

    // set the HTTP header
    let headers = new HttpHeaders()
    headers = headers.set('Content-Type',
      'application/x-www-form-urlencoded')

    // make the POST request
    this.http.post<any>('http://localhost:3000/login',
      params.toString(), {headers})
      .toPromise()
      .then(resp => {
        console.info('Response: ', resp)
      })
      .catch(err => {
        console.error('ERROR: ', err)
      })

  }

}
