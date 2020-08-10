import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})
export class MapModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map', {static: false}) mapElementRef: ElementRef;
  // center = {lat: 28.61616162409036, lng: 28.61616162409036}; Ez Zawarah
  @Input() center = {lat: -34.397, lng: 150.644};
  @Input() selectable = true;
  @Input() closeButtonText = 'Cancel';
  @Input() title = 'Pick Location';
  clickListener: any;
  googleMaps: any;

  constructor(private modalController: ModalController, private renderer2: Renderer2) { }

  ngOnInit() {}

  onCancel() {
    this.modalController.dismiss();
  }

  private getGoogleMaps(): Promise<any> {
    const win = window as any;
    const googleModule = win.google;
    if (googleModule && googleModule.maps) {
      return Promise.resolve(googleModule.maps);
    }
    return new Promise((resolve, reject) =>  {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + environment.googleMapsAPIKey;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => {
        const loadedGoogleModule = win.google;
        if (loadedGoogleModule && loadedGoogleModule.maps) {
          resolve(loadedGoogleModule.maps);
        } else {
          reject('Google maps SDK not available.');
        }
      };
    });
  }

  ngAfterViewInit(): void {
    this.getGoogleMaps().then(googleMaps => {
      this.googleMaps = googleMaps;
      const mapEl = this.mapElementRef.nativeElement;
      const map = new googleMaps.Map(mapEl, {
        center: this.center,
        zoom: 16
      });
      googleMaps.event.addListenerOnce(map, 'idle', () => {
        this.renderer2.addClass(mapEl, 'visible');
      });

      if (this.selectable) {
        this.clickListener = map.addListener('click', event => {
          const selectedCoords = {lat: event.latLng.lat(), lng: event.latLng.lat()};
          this.modalController.dismiss(selectedCoords);
        });
      } else {
        const marker = new googleMaps.Marker({
          position: this.center,
          map,
          title: 'Picked Location'
        });
        marker.setmMap(map);
      }
    }).catch(error => {
      console.log(error);
    });
  }

  ngOnDestroy(): void {
    if (this.clickListener) {
      this.googleMaps.event.removeListener(this.clickListener);
    }
  }
}
