import {Component, OnInit} from '@angular/core';
import {CameraService} from '../camera.service';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {Router} from "@angular/router";
import {AuthService} from "../auth.service";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  mainForm: FormGroup

  imagePath = '/assets/cactus.png'

  constructor(private authSvc: AuthService, private cameraSvc: CameraService, private fb: FormBuilder, private http: HttpClient, private router: Router) {
  }

  ngOnInit(): void {
    if (this.cameraSvc.hasImage()) {
      const img = this.cameraSvc.getImage()
      this.imagePath = img.imageAsDataUrl
      console.log(img)
      this.mainForm = this.createMain(img)
    } else {
      this.mainForm = this.createMain()
    }

  }

  private createMain(img?): FormGroup {
    return this.fb.group({
      title: this.fb.control('', [Validators.required]),
      comments: this.fb.control('', [Validators.required]),
      'image': ([img, Validators.required])
    })
  }

  share() {

    let formData: any = new FormData();
    formData.set("title", this.mainForm.get('title').value);
    formData.set("comments", this.mainForm.get('comments').value);
    formData.set("picture", this.cameraSvc.getImage().imageData)

    this.authSvc.tryAuth(this.authSvc.authCreds)
      .then(() => {
        this.http.post('/share', formData)
          .toPromise()
          .then(() => {
            this.clear()
          })
      })
  }

  clear() {
    this.imagePath = '/assets/cactus.png'
    this.mainForm = this.createMain()
  }
}
