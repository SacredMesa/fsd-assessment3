import {Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {Router} from "@angular/router";

import {AuthService} from "../auth.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  errorMessage = ''

  loginForm: FormGroup

  constructor(private authSvc: AuthService, private fb: FormBuilder, private http: HttpClient, private router: Router) {
  }

  ngOnInit(): void {
    this.loginForm = this.createLogin()
  }

  private createLogin(): FormGroup {
    return this.fb.group({
      username: this.fb.control('', [Validators.required]),
      password: this.fb.control('', [Validators.required])
    })
  }

  attemptLogin() {
    console.info('form = ', this.loginForm.value)
    const value = this.loginForm.value

    this.authSvc.tryAuth(value)
      .then((results) => {
        this.authSvc.authCreds = this.loginForm.value;
        this.router.navigate(['/main'])
      })
      .catch(e => {
        console.error('ERROR: ', e)
        this.errorMessage = 'Username or Password is Incorrect'
      })
  }
}
