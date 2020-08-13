import { Component, OnInit } from '@angular/core';
import {AuthService} from './auth.service';
import {Router} from '@angular/router';
import {AlertController, LoadingController} from '@ionic/angular';
import {NgForm} from '@angular/forms';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;
  isLogin = true;

  constructor(
      private authService: AuthService,
      private router: Router,
      private loadingController: LoadingController,
      private alertController: AlertController
      ) { }

  ngOnInit() {
  }

  authenticate(email: string, password: string) {
    this.isLoading = true;
    this.loadingController.create({keyboardClose: true, message: 'Logging in...'})
        .then(loadingEl => {
          loadingEl.present();
          let authObs: Observable<AuthResponseData>;
          if (this.isLogin) {
              authObs = this.authService.login(email, password);
          } else {
              authObs =  this.authService.signup(email, password);
          }
          authObs.subscribe(resData => {
              console.log(resData);
              this.isLoading = false;
              loadingEl.dismiss();
              this.router.navigateByUrl('/places/tabs/discover');
            }, errorResponse => {
              console.log(errorResponse);
              loadingEl.dismiss();
              const code = errorResponse.error.error.message;
              let message = 'Could not sign you up, Please try again.';
              if (code === 'EMAIL_EXISTS') {
                  message = 'This email address exists already!';
              } else if (code === 'EMAIL_NOT_FOUND') {
                  message = 'E-Mail address could not be found.';
              } else if (code === 'INVALID_PASSWORD') {
                  message = 'This password is not correct.';
              }
              this.showAlert(message);
          });
        });
  }

  onSubmit(form: NgForm) {
    console.log(form);
    if (!form.valid) {
        return;
    }
    const email = form.value.email;
    const password = form.value.password;
    this.authenticate(email, password);
    form.reset();
  }

  private showAlert(message: string) {
      this.alertController.create({
          header: 'Authentication failed',
          message: message,
          buttons: ['Okay']
      }).then(alertEl => {
          alertEl.present();
      });
  }

  onSwitchAuthMode() {
    this.isLogin = !this.isLogin;
  }
}
