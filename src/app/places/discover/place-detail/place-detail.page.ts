import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ActionSheetController, AlertController, LoadingController, ModalController, NavController} from '@ionic/angular';
import {PlacesService} from '../../places.service';
import {CreateBookingComponent} from '../../../bookings/create-booking/create-booking.component';
import {Place} from '../../place.model';
import {Subscription} from 'rxjs';
import {BookingService} from '../../../bookings/booking.service';
import {AuthService} from '../../../auth/auth.service';
import {MapModalComponent} from '../../../shared/map-modal/map-modal.component';
import {switchMap, take} from 'rxjs/operators';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  place: Place;
  isBookable = false;
  isLoading = false;
  private placeSubscription: Subscription;
  constructor(
      private router: Router,
      private route: ActivatedRoute,
      private navController: NavController,
      private placesService: PlacesService,
      private modalController: ModalController,
      private actionSheetController: ActionSheetController,
      private bookingService: BookingService,
      private loadingController: LoadingController,
      private authService: AuthService,
      private alertController: AlertController
      ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navController.navigateBack('/places/tabs/discover');
        return;
      }
      this.isLoading = true;
      let fetchedUserId: string;
      this.authService.userId.pipe(take(1), switchMap(userId => {
          if (!userId) {
              throw new Error('Found no user!');
          }
          fetchedUserId = userId;
          return this.placesService.getPlace(paramMap.get('placeId'));
      })).subscribe(place => {
              this.place = place;
              this.isBookable = place.userId !== fetchedUserId;
              this.isLoading = false;
          }, error => {
              this.alertController.create({
                  header: 'An error ocurred! ' ,
                  message: 'Could not load place.',
                  buttons: [
                      {
                          text: 'Okay',
                          handler: () => {
                              this.router.navigate(['/places/tabs/discover']);
                          }
                      }
                  ]
              }).then(alertEl => {
                  alertEl.present();
              });
          });
    });
  }

  onBookPlace() {
    // this.router.navigate(['/places/tabs/discover']);
    // this.navController.navigateBack(['/places/tabs/discover']);
    // this.navController.pop();

    this.actionSheetController.create({
        header: 'Choose an Action',
        buttons: [
            {
                text: 'Selected Date',
                handler: () => {
                    this.openBookingModal('select');
                }
            },
            {
                text: 'Random Date',
                handler: () => {
                    this.openBookingModal('random');
                }
            },
            {
                text: 'Cancel',
                role: 'cancel'
            }
        ]
    }).then(actionSheetEl => {
        actionSheetEl.present();
    });

  }

  openBookingModal(mode: 'select' | 'random') {
      console.log(mode);
      this.modalController.create({
          component: CreateBookingComponent,
          componentProps: {selectedPlace: this.place, selectedMode: mode}
      })
          .then(modalEl => {
              modalEl.present();
              return modalEl.onDidDismiss();
          })
          .then(resultData => {
              if (resultData.role === 'confirm') {
                  this.loadingController.create({
                      message: 'Booking place...'
                  }).then(loadingEl => {
                      loadingEl.present();
                      const data = resultData.data.bookingData;
                      this.bookingService.addBooking(
                          this.place.id,
                          this.place.title,
                          this.place.imageUrl,
                          data.firstName,
                          data.lastName,
                          data.guestNumber,
                          data.startDate,
                          data.endDate
                      )
                      .subscribe(() => {
                          loadingEl.dismiss();
                      }, error => {
                          console.log(error);
                      });
                  });

              }
              if (resultData.role === 'cancel') {
                  console.log('cancel');
              }
          });
  }

    ngOnDestroy(): void {
      if (this.placeSubscription) {
          this.placeSubscription.unsubscribe();
      }
    }

    onShowFullMap() {
        this.modalController.create({
                    component: MapModalComponent,
                    componentProps: {
                        center: {lat: this.place.location.lat, lng: this.place.location.lng},
                        selectable: false,
                        closeButtonText: 'Close',
                        title: this.place.location.address
                    }
                }
            ).then(modalEl => {
                modalEl.present();
            });
    }
}
