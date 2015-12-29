// jquery DOM-ready shorthand
// instead of $(document).ready(function() {
$(function() {
    // using strict-mode
    'use strict';

    // my view-model as a property of my namespace-object
    // not polluting the global scope
    my.vm = function() {

        // the old "self-trick"
        var self = this;

        // for google-map, markers & info-windows
        var map;
        var markers = [];
        var infowindow;

        // for domCaching()
        var spans;

        // hooking up to the input-field
        this.filter = ko.observable('');
        // using input-value to filter the neighborhoods-array
        // storing result in a computed observable
        // which is used for the data-bind in the view
        this.filteredLocations = ko.computed(function() {
            var filterInput = this.filter().toLowerCase();
            return ko.utils.arrayFilter(my.neighborhoods, function(item) {
                return item.title.toLowerCase().indexOf(filterInput) >= 0;
            });
        }, this);

        // classic init-function
        this.init = function() {
            this.domCaching();
            this.initMap();
            this.initMarkers();
            this.updateMarkers();
            this.removeWikiLinksOnFilter();
            this.bindHandlersOnMarkers();
            this.activateSlideToggle();
        };

        // caching all span-elements for addClass('active')
        this.domCaching = function() {
            spans = document.getElementsByTagName('span');
        };

        // firing up the fullscreen-map showing my beautiful hometown
        this.initMap = function() {
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 14,
                center: {lat: 51.224, lng: 6.775}
            });
        };

        // initially showing all markers based on neighborhoods-array in the model
        this.initMarkers = function() {
            for (var i = 0; i < my.neighborhoods.length; i++) {
                markers.push(new google.maps.Marker({
                    position: my.neighborhoods[i].position,
                    title: my.neighborhoods[i].title,
                    map: map
                }));
            };
        };

        // subscribing to changes of the filteredLocations-array
        // for updating the markers automatically
        this.updateMarkers = function() {
            this.filteredLocations.subscribe(function(items) {
                for (var i = 0; i < markers.length; i++) {
            		markers[i].setMap(null);
            	};
                markers = [];
                for (var i = 0; i < items.length; i++) {
                    markers.push(new google.maps.Marker({
                        position: items[i].position,
                        title: items[i].title,
                        map: map,
                        visible: true
                    }));
                };
                self.bindHandlersOnMarkers();
            });
        };

        // binding click-handlers on all markers for doing stuff when they are clicked
        this.bindHandlersOnMarkers = function() {
            for (var i = 0; i < markers.length; i++) {
            	google.maps.event.addListener(markers[i], 'click', function() {
                    // using 'showWikiLinks' function for WikiLinksResults
                    // when clicking on a marker
                    self.showWikiLinks(this);
                    // stop bouncing all markers
                    self.unBounceMarkers();
                    // start bouncing this marker
                    self.bounceMarker(this);
                    // li-item not bold anymore
                    $(spans).removeClass('active');
                    // opens infowindow sending map, clicked marker and
                    // content as parameters
                    self.openInfoWindow(map, this, this.title);
            	});
            }
        };

        // helper-function for bouncing a specific marker
        this.bounceMarker = function(marker) {
            marker.setAnimation(google.maps.Animation.BOUNCE);
        };

        // helper-function for stop bouncing all markers
        this.unBounceMarkers = function() {
            for (var i = 0; i < markers.length; i++) {
        		markers[i].setAnimation(null);
        	}
        };

        // closes last infowindow and opens new one for clicked marker
        this.openInfoWindow = function(map, marker, content) {
            if (infowindow) {
                infowindow.close();
            }
            infowindow = new google.maps.InfoWindow({
                content: '<strong>' + content + '</strong>'
            });
            infowindow.open(map, marker);
        };

        // creating an observableArray for showing the results in the view
        this.WikiLinksResults = ko.observableArray([]);
        // querying Wikipedia via jquery-ajax and
        // pushing the results into observableArray
        this.showWikiLinks = function(item) {
            $.ajax({
                url: 'http://en.wikipedia.org/w/api.php',
                data: {
                        action: 'query',
                        list: 'search',
                        srsearch: item.title,
                        format: 'json'
                    },
                dataType: 'jsonp',
                success: function(data) {
                    // flushing the array
                    self.WikiLinksResults.removeAll();
                    // ten results should be enough
                    for (var i = 0; i < 10; i++) {
                        var title = data.query.search[i].title;
                        var url = 'http://en.wikipedia.org/wiki/' + title;
                        var obj = {'title': title, 'url': url};
                        self.WikiLinksResults.push(obj);
                    };
                },
                error: function() {
                    alert("Oops, something did not work!");
                }
            });
        };

        // hooked up to the location list-item
        this.onClick = function(data, event) {
            var clickedEl = event.toElement;
            $(spans).removeClass('active');
            $(clickedEl).addClass('active');
            self.showWikiLinks(this);
            self.unBounceMarkers();
            for (var i = 0; i < markers.length; i++) {
                if (markers[i].title == this.title) {
                    self.bounceMarker(markers[i]);
                    self.openInfoWindow(map, markers[i], markers[i].title);
                }
            }
        };

        // hooked up to 'clear all' in the view
        this.removeWikiLinks = function() {
            this.WikiLinksResults.removeAll();
        };

        // removing the Wikipedia-results when filtering is going on
        this.removeWikiLinksOnFilter = function() {
            this.filteredLocations.subscribe(function() {
                self.WikiLinksResults.removeAll();
            });
        };

        // for minimizing the list-box on mobile
        // revealing more of the map
        this.activateSlideToggle = function() {
            $('.slideToggle').click(function(){
                $('.panel-body').slideToggle();
            });
        };

        // firing everything up
        this.init();

    };

    // apply knockout-binding to my view-model
    ko.applyBindings(new my.vm());

});
