import {Component, OnDestroy, OnInit} from '@angular/core';
import {PlacesService} from '../places.service';
import {Place} from '../place.model';
import {MenuController} from '@ionic/angular';
import {Subscription} from 'rxjs';
import {AuthService} from '../../auth/auth.service';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit, OnDestroy {
  loadedPlaces: Place[];
  ListedLoadedPlaces: Place[];
  private filter = 'all';
  relevantPlaces: Place[];
  private placesSubscription: Subscription;
  private isLoading = false;

  constructor(
      private placesService: PlacesService,
      private menuCtrl: MenuController,
      private authService: AuthService
      ) { }

  ngOnInit() {
    this.placesSubscription = this.placesService.places.subscribe(places => {
      this.loadedPlaces = places;
      this.onFilterUpdate(this.filter);
      this.relevantPlaces = this.loadedPlaces;
      this.ListedLoadedPlaces = this.relevantPlaces.slice(1);
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.placesService.fetchPlaces().subscribe(() => {
      this.isLoading = false;
    });
  }

  onOpenMenu() {
    this.menuCtrl.toggle();
  }

  onFilterUpdate(filter: string) {
    const isShown = place => filter === 'all' || place.userId !== this.authService.userId;
    this.relevantPlaces = this.loadedPlaces.filter(isShown);
    this.filter = filter;
    // if (event.detail.value === 'all') {
    //   this.relevantPlaces = this.loadedPlaces;
    //   this.ListedLoadedPlaces = this.relevantPlaces.slice(1);
    // } else {
    //   this.relevantPlaces = this.loadedPlaces.filter(place => place.userId !== this.authService.userId);
    //   this.ListedLoadedPlaces = this.relevantPlaces.slice(1);
    // }
  }

  ngOnDestroy(): void {
    if (this.placesSubscription) {
      this.placesSubscription.unsubscribe();
    }
  }
}
