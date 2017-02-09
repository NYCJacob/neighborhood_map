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
    // google place search global because needed for google's getDetails method
    app.service;
    var infowindow;
    app.inspectionsArray = [];
    app.RestaurantArray= [];
    // used to track highlight for reset on next click
    app.currentHighlight = null;

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



        // single infoWindow instance
        app.infoWindow = new google.maps.InfoWindow();
        // app.infoWindow.setContent(infoContent);

        // first get standard place data - need place_id for details search
        //TODO: need onerror handler
        getPlacesData();
    };  // end app.init

    // based on google map place search api example
    // https://developers.google.com/maps/documentation/javascript/examples/place-search
    function getPlacesData(){
        app.service = new google.maps.places.PlacesService(app.map);
        app.service.nearbySearch({
            location: app.neighborhood,
            radius: 500,
            type: ['restaurant']
        }, callback);
    }

    function callback(results, status) {
        if (status=== google.maps.places.PlacesServiceStatus.OK) {
            app.RestaurantArray = results.map(function (item) {
                // passing index for map marker/list numbering
                var itemIndex = results.indexOf(item);
                return new Restaurant(item, itemIndex);
            });
            app.RestaurantArray.forEach(createMarker);
            app.RestaurantArray.forEach(googleDetails);
            // make vm app globle so selector function works
            app.vm = new RestaurantsViewModel(app.RestaurantArray);
            // apply ko bindings
            ko.applyBindings(app.vm, document.getElementById('main-content'));


        } else {
            console.log("place service status error");
        }
    }  // end callback

    function googleDetails(restaurant) {
        var serviceDetails =  new google.maps.places.PlacesService(app.map);
        var request = { placeId: restaurant.placeId };
        serviceDetails.getDetails(request, callback);
        function callback(details, status){
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                console.log('Details received ' + details);
                // need to send details to the restaurant object
                restaurant.addDetails(details);
            }else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                setTimeout(function() {
                    googleDetails(restaurant);
                }, 200);}
            else {
                console.log("details error " + status);
            }
        }
    } // end googleDetails


    function createMarker(place) {
        // set icon for marker
        var image = {
            url: place.mapIcon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        // Create a marker for each place.
        place.mapMarker = new google.maps.Marker({
            map: app.map,
            icon: image,
            title: place.name,
            animation: google.maps.Animation.DROP,
            position: place.geometry.location,
            id: place.id
            // content: place.name + 'Rating: ' + place.rating + '<br>' + 'Price Level (0 - 4): ' + place.priceLevel
        });

        google.maps.event.addListener(place.mapMarker, 'click', function () {
            console.log('mapMarker clicked');
            app.vm.octoHighlighter(place);
        })

    } // end create marker



    // Restaurant Model
    // ----------
    // Our basic restaurant based on google place response object
    //  see https://developers.google.com/maps/documentation/javascript/places#place_search_responses
    var Restaurant;
    Restaurant = function (restaurantObj, index) {
        // self added to access object from ajax callback
        var self = this;
        //todo decide whether to use index numbering in map- hard to place number in restaurant icon
        this.index = index + 1;   // 1 added for UI numbering ;
        self.selected = false;
        this.mapIconNormal = 'img/mapMakerIcons/3b8dc8/restaurant.png';
        this.mapIconRed = 'img/mapMakerIcons/ff0000/restaurant.png';
        // details search geometry object includes
        // location object and viewport object
        this.geometry = restaurantObj.geometry;
        this.address_formatted = '';
        this.address_components = restaurantObj.address_components;
        this.phone = restaurantObj.formatted_phone_number;
        this.hours = restaurantObj.opening_hours;
        this.photos = restaurantObj.photos;
        this.reviews = restaurantObj.reviews;
        this.website = '';
        this.id = restaurantObj.id;
        this.name = restaurantObj.name;
        this.placeId = restaurantObj.place_id;
        this.priceLevel = restaurantObj.price_level;
        this.rating = restaurantObj.rating;
        this.vicinity = restaurantObj.vicinity;
        this.mapIcon = this.mapIconNormal;
        this.mapMarker = '';
        this.getName = function () {
            return this.name;
        };

        this.inspectionResults = ko.observableArray();
        // method to process details data into object
        this.addDetails = function(details){
            this.address_components = details.address_components;
            this.address_formatted = details.formatted_address;
            this.phone = details.formatted_phone_number;
            this.geometry = details.geometry;
            this.hours = details.opening_hours;
            this.rating = details.rating;
            this.photos = details.photos;
            this.reviews = details.reviews;
            this.website = details.website;
        };
        this.yelpResults = ko.observableArray();
    };

    function makeInfoHTML(place) {
        // for some reason cannot use .slice on address_formatted
        var addressString = place.address_formatted;
        // remove USA from address
        var addressDisplay = addressString.slice(0, -5);

        var openNow = function () {
          if (place.hours.open_now === true) {
              return 'YES';
          }  else if (place.hours.open_now === false) {
              return "NO";
          } else
              return 'unknown';
        } ;

        var openHours = function () {
            var HTML = '<ul>';
            for (var i = 0; i < place.hours.weekday_text.length; i++) {
                // console.log(place.hours.weekday_text[i]);
                HTML += '<li>' + place.hours.weekday_text[i] + '</li>';
            }
            HTML += '</ul>';
            return HTML;
        };

        var priceIcon = function () {
            switch (place.priceLevel) {
                case 1:
                    return '$';
                    break;
                case 2:
                    return '$$';
                    break;
                case 3:
                    return '$$$';
                    break;
                case 4:
                    return '$$$$';
                    break;
                case 5:
                    return '$$$$$';
                    break;
                default:
                    return 'unknown';
            }
        };


        var infoContent =
            '<div class="infoWindow">' +
                '<span class="infoWindow-name">' + place.name  + '</span>' +
                '<span class="infoWindow-address">' + addressDisplay  + '</span>' +
                '<span class="infoWindow-website">Website ' + place.website  + '</span>' +
                '<span class="infoWindow-priceLevel">Price Level: ' + '</span>' + '<span class="dollar-sign"><strong>' + priceIcon() + '</strong></span>'   + ' | ' +
                '<span class="infoWindow-rating">Google Rating: ' + '</span>' + '<span><strong>' + place.rating + '</strong></span>'+
                '<span class="infoWindow-openNow">' + 'Open Now: ' + openNow()  + '</span>' +
                '<span class="infoWindow-hours">' + '<strong>' + 'Hours: ' + '</strong>' + '</span>' +
                '<span class="infoWindow-open">' + openHours() + '</span>';
        return infoContent;
    }

    function RestaurantsViewModel(mappedArray) {
        var self = this;
        self.restaurants = ko.observableArray(mappedArray);
        self.getRestaurants = function () {
            return self.restaurants;
        };
        // used to tell viewModel what to display
        self.currentPlace = ko.observable(null);
        // headline for review in sidebar- when clicked show reviews
        self.reviewHeadline = ko.observable();
        self.showReviews = ko.observable(false);
        self.inspectionHeadline = ko.observable();
        self.showInspections = ko.observable(false);
        self.showYelp = ko.observable(false);
        self.yelpHeadline = ko.observable();
        // method called when either list or marker clicked
        self.octoHighlighter = function (clickedPlace) {
            if (self.currentPlace() !== null) {
                self.currentPlace().mapMarker.setIcon(self.currentPlace().mapIconNormal);
                // clear details sidebarhtml
                self.reviewHeadline('');
            }
            clickedPlace.mapMarker.setIcon(clickedPlace.mapIconRed);
            app.infoWindow.setContent(makeInfoHTML(clickedPlace));
            app.infoWindow.open(app.map, clickedPlace.mapMarker);
            // make clicked place the current place
            self.currentPlace(clickedPlace);
            self.reviewHeadline( self.currentPlace().name + ' has ' + self.currentPlace().reviews.length + ' reviews from Google.');
            // api calls
            self.getNYCinspections(self.currentPlace);
            self.getYelp(self.currentPlace);
        };

        self.toggleReviews = function () {
            if ( self.showReviews() === false ) {
                self.showReviews(true);
            } else {
                self.showReviews(false);
            }
        };

        self.toggleInspections = function () {
            if ( self.showInspections() === false ) {
                self.showInspections(true);
            } else {
                self.showInspections(false);
            }
        };

        self.toggleYelp = function () {
            if ( self.showYelp() == false ) {
                self.showYelp(true);
            } else {
                self.showYelp(false);
            }
        }

        self.getNYCinspections = function (currentPlace) {
            console.log('hit getNYCinspections method');
            // api request all caps
            var nycPlaceName = currentPlace().name.toUpperCase();
            $.ajax({
                url: "https://data.cityofnewyork.us/resource/9w7m-hzhe.json",
                type: "GET",
                data: {
                    "zipcode": "11372",
                    "dba": nycPlaceName,
                    "$limit": 50,
                    "$$app_token": "PCvLGVSSaI1KBWr0dwX7vhl1E",
                    "$select": "*"
                }
            }).done(function (data) {
                // data is an array of objections returned from api
                console.log('nyc ajax done: ' + data);
                // todo a better api call might avoid this processing
                // array of graded inspection from all inspections because not all have grade
                // although all inspections have a score which could be used in future version
                var gradedInspections = [];
                data.forEach(function (inspection) {
                    if (inspection.hasOwnProperty('grade')) {
                        // convert to date object for sorting/ easier display options
                        inspection.grade_date = new Date(inspection.grade_date);
                        // short date for ui display
                        inspection.grade_date_display = inspection.grade_date.getMonth() + '-' + inspection.grade_date.getDate() + '-' +
                                inspection.grade_date.getFullYear();


                        gradedInspections.push(inspection);
                    }
                });
                // sort inspections by date most recent first
                gradedInspections.sort(function(a,b){return b.grade_date - a.grade_date});
                self.currentPlace().inspectionResults(gradedInspections);
                // todo why headline doesn't work if in currentPlace()
                self.inspectionHeadline('Latest Grade: ' + gradedInspections[0].grade);
            }).fail(function() {
                console.log( "nycinspection ajax error" );
            });
        };

        self.getYelp = function (currentPlace) {
            // oAuth token  yelp api2.0 uses oAuth 1.0  NOT FUSION which uses oauth2
            /**
             * Generates a random number and returns it as a string for OAuthentication
             * @return {string}
             *
             */
            function nonce_generate() {
                return (Math.floor(Math.random() * 1e12).toString());
            }

            function cleanPhone(phone) {
                return phone.replace(/\D/g,'');
            }

            var phone = cleanPhone(currentPlace().phone);
            var  consumerSecret = 'gtnzS8XUXupQ7t3yEUM-zgJeNz8';
            var  consumer_key  = '5e8aVm47PCOnFIqWNsAO3A';
            var token  =  'e9CjCBMdlA3nunOhtdN9xHkNyc_Qa329';
            var tokenSecret  = 'z9vc2A_2yoIUYqe34Z3hKZlddYI';
            var httpMethod = 'GET';
            var yelpUrl = 'https://api.yelp.com/v2/phone_search?phone=' + phone;

            var yelpParams = {
                phone: phone,
                oauth_consumer_key: consumer_key,
                oauth_token: token,
                oauth_nonce: nonce_generate(),
                oauth_timestamp: Math.floor(Date.now()/1000),
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version : '1.0',
                callback: 'cb'
            };

            var encodedSignature = oauthSignature.generate(httpMethod, yelpUrl, yelpParams, consumerSecret, tokenSecret);
            yelpParams.oauth_signature = encodedSignature;

            var settings = {
                url: yelpUrl,
                data: yelpParams,
                cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
                dataType: 'jsonp',
                success: function(results) {
                    // Do stuff with results
                    console.log("SUCCCESS! %o", results);
                    //  Yelp api sucks needs checking
                    var cleanYelpResults;
                    if (results.businesses.length > 1) {  // more than one business in results
                        results.businesses.forEach(function (business) {
                            if (business.name === currentPlace().name) {
                                cleanYelpResults = business;
                            }
                        });
                        self.currentPlace().yelpResults(cleanYelpResults.businesses[0]);  // assuming there is only one obj in array
                    } else {
                        self.currentPlace().yelpResults(results.businesses[0]);  // assuming there is only one obj in array
                    }
                    self.yelpHeadline("Yelp has " +  self.currentPlace().yelpResults().review_count + " reviews.");
                },
                error: function(error) {
                    // Do stuff on fail
                    console.log(error);
                }
            };
// todo send yelp data to view
            // Send AJAX query via jQuery library.
            $.ajax(settings);

        };  // end getYelp

    }


})();