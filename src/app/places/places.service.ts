import {Injectable} from '@angular/core';
import {Place} from './place.model';
import {AuthService} from '../auth/auth.service';
import {BehaviorSubject, of} from 'rxjs';
import {delay, map, take, tap, switchMap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {PlaceLocation} from './location.model';

interface PlaceData {
    title: string;
    description: string;
    imageUrl: string;
    price: number;
    availableFrom: Date;
    availableTo: Date;
    userId: string;
    location: PlaceLocation
}

@Injectable({
    providedIn: 'root'
})
export class PlacesService {
    private _places = new BehaviorSubject<Place[]>([]);

    constructor(private authService: AuthService, private httpClient: HttpClient) {
    }

    fetchPlaces() {
        return this.httpClient.get<{ [key: string]: PlaceData }>('https://booking-app-ionic-acecb.firebaseio.com/offered-places.json')
            .pipe(
                map(resData => {
                    const places = [];
                    for (const key in resData) {
                        if (resData.hasOwnProperty(key)) {
                            places.push(
                                new Place(
                                    key,
                                    resData[key].title,
                                    resData[key].description,
                                    resData[key].imageUrl,
                                    resData[key].price,
                                    new Date(resData[key].availableFrom),
                                    new Date(resData[key].availableTo),
                                    resData[key].userId,
                                    resData[key].location
                                )
                            );
                        }
                    }
                    return places;
                }),
                tap(places => {
                    this._places.next(places);
                })
            );
    }

    get places() {
        return this._places.asObservable();
    }

    getPlace(id: string) {
        return this.httpClient.get<PlaceData>(`https://booking-app-ionic-acecb.firebaseio.com/offered-places/${id}.json`).
        pipe(map(placeData => {
            return new Place(
                id,
                placeData.title,
                placeData.description,
                placeData.imageUrl,
                placeData.price,
                new Date(placeData.availableFrom),
                new Date(placeData.availableTo),
                placeData.userId,
                placeData.location
            );
        }));
    }

    addPlace(title: string, description: string, price: number, dateFrom: Date, dateTo: Date, location: PlaceLocation) {
        let generatedId: string;
        const newPlace = new Place(
            Math.random().toString(),
            title,
            description,
            'https://lonelyplanetimages.imgix.net/mastheads/GettyImages-538096543_medium.jpg?sharp=10&vib=20&w=1200',
            price,
            dateFrom,
            dateTo,
            this.authService.userId,
            location
        );

        return this.httpClient.post<{ name: string }>('https://booking-app-ionic-acecb.firebaseio.com/offered-places.json', {
            ...newPlace,
            id: null
        })
            .pipe(
                switchMap(resData => {
                    generatedId = resData.name;
                    return this.places;
                }),
                take(1),
                delay(2000),
                tap(places => {
                    newPlace.id = generatedId;
                    this._places.next(places.concat(newPlace));
                })
            );
    }

    updatePlace(placeId: string, title: string, description: string) {
        let updatedPlaces: Place[];
        return this.places.pipe(take(1), switchMap(places => {
            if (!places || places.length <= 0) {
                return this.fetchPlaces();
            } else {
                return  of(places);
            }
        }),
            switchMap(places => {
                const updatedPlaceIndex = places.findIndex(pl => pl.id === placeId);
                updatedPlaces = [...places];
                const oldPlace = updatedPlaces[updatedPlaceIndex];
                updatedPlaces[updatedPlaceIndex] = new Place(
                    oldPlace.id,
                    title,
                    description,
                    oldPlace.imageUrl,
                    oldPlace.price,
                    oldPlace.availableFrom,
                    oldPlace.availableTo,
                    oldPlace.userId,
                    oldPlace.location
                );
                return this.httpClient.put(
                    `https://booking-app-ionic-acecb.firebaseio.com/offered-places/${placeId}.json`,
                    {...updatedPlaces[updatedPlaceIndex], id: null}
                );
            }),
            tap(() => {
                this._places.next(updatedPlaces);
            })
        );
    }
}
