/**
 * Created by jsherman on 1/16/17.
 */
var app = app || {};

(function () {
    'use strict';

    app.neighborhood =  {  // Jackson Heights MTA Train station lat ln
        "lat" : 40.7466891,
        "lng" : -73.8908579
    };
       // Restaurant Model
    // ----------

    // Our basic restaurant based on google place response object
    //  see https://developers.google.com/maps/documentation/javascript/places#place_search_responses
    // represent a single restaurant item
    var Restaurant = function (restaurantObj) {
        this.geometry = ko.observable(restaurantObj.geometry);
        this.id =ko.observable(restaurantObj.id);
        this.name =ko.observable(restaurantObj.name);
        this.placeId =ko.observable(restaurantObj.placeId);
    };
    app.initMap = function() {
        var styles = [
            {
                featureType: 'water',
                stylers: [
                    {color: '#19a0d8'}
                ]
            }, {
                featureType: 'administrative',
                elementType: 'labels.text.stroke',
                stylers: [
                    {color: '#ffffff'},
                    {weight: 6}
                ]
            }, {
                featureType: 'administrative',
                elementType: 'labels.text.fill',
                stylers: [
                    {color: '#e85113'}
                ]
            }, {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [
                    {color: '#efe9e4'},
                    {lightness: -40}
                ]
            }, {
                featureType: 'transit.station',
                stylers: [
                    {weight: 9},
                    {hue: '#e85113'}
                ]
            }, {
                featureType: 'road.highway',
                elementType: 'labels.icon',
                stylers: [
                    {visibility: 'off'}
                ]
            }, {
                featureType: 'water',
                elementType: 'labels.text.stroke',
                stylers: [
                    {lightness: 100}
                ]
            }, {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [
                    {lightness: -100}
                ]
            }, {
                featureType: 'poi',
                elementType: 'geometry',
                stylers: [
                    {visibility: 'on'},
                    {color: '#f0e4d3'}
                ]
            }, {
                featureType: 'road.highway',
                elementType: 'geometry.fill',
                stylers: [
                    {color: '#efe9e4'},
                    {lightness: -25}
                ]
            }
        ];

        var mapEle = document.getElementById('mapDiv');

        app.map = new google.maps.Map(mapEle, {
            center: app.neighborhood,
            zoom: 16,
            styles: styles,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            navigationControl: true,
            navigationControlOptions: {
                style: google.maps.NavigationControlStyle.SMALL
            }
        });
        getPlacesData();
    };  // end app.init

    // based on google map place search api example
    // https://developers.google.com/maps/documentation/javascript/examples/place-search
    // infowindow = new google.maps.InfoWindow();
    function getPlacesData(){
        var service = new google.maps.places.PlacesService(app.map);
        service.nearbySearch({
            location: app.neighborhood,
            radius: 500,
            type: ['restaurant']
        }, callback);
    };

    function callback(results, status) {
        if (status=== google.maps.places.PlacesServiceStatus.OK) {
            app.RestaurantArray = results.map(function (item) {
                return new Restaurant(item);
            });
            RestaurantsViewModel.restaurants = app.RestaurantArray;
        }
    };


    function createMarker(place) {
        // set icon for marker
        var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        // Create a marker for each place.
        var marker = new google.maps.Marker({
            map: app.map,
            icon: icon,
            title: place.name,
            position: place.geometry.location,
            id: place.place_id
        });

        // google.maps.event.addListener(marker, 'click', function() {
        //     infowindow.setContent(place.name);
        //     infowindow.open(map, this);
        // });
    }


    // Restaurant Model
    // ----------
    // Our basic restaurant based on google place response object
    //  see https://developers.google.com/maps/documentation/javascript/places#place_search_responses
    var Restaurant = function (restaurantObj) {
        this.geometry = ko.observable(restaurantObj.geometry);
        this.id =ko.observable(restaurantObj.id);
        this.name =ko.observable(restaurantObj.name);
        this.placeId =ko.observable(restaurantObj.placeId);
    };

    // our main view model
    // var RestaurantsVM = new RestaurantsViewModel();
    // ko.applyBindings(RestaurantsVM);

    function RestaurantsViewModel() {
        var self = this;
        self.restaurants = ko.observableArray();

        // var restaurantsMapped = app.resultsArray.map(function (item) {
        //     return new Restaurant(item);
        // });
        // console.log(restaurantsMapped);
        // self.restaurants = restaurantsMapped;
    };
    ko.applyBindings(RestaurantsViewModel);
    // var viewModel = new ViewModel(app.resultsArray || []);
    // function callKo() {
    //     ko.applyBindings(new RestaurantsViewModel);
    // }


})();