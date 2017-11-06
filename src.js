
/**
 * This is the location model which shows the properties of a given location
 * @param {*} name searchable name of the given location
 * @param {*} lat  latitude
 * @param {*} lng  longitude
 * @param {*} fourSquareId Foursquare API id for venu detailed information
 */

var LocationModel = function (name, lat, lng, fourSquareId) {
    var self =this;
    self.name = name;
    self.position = {lng: lng, lat: lat};
    self.fourSquareId = fourSquareId;
    self.marker = null;
};

/**
 * This is the main data array which shows the neighbourhood location data
 */
var dataPoints = [
    new LocationModel('Beverly Street', 6.890622, 79.858873, '4c26f4ed3703d13a175da636'),
    new LocationModel('Barista', 6.910408, 79.861888, '4ba06f61f964a520986d37e3'),
    new LocationModel('Baskin Robins', 6.907677, 79.850826, '4be3f02921d5a593a6391a11'),
    new LocationModel('Sinhalese Sports Club', 6.905750, 79.869462, '53c28e2b498ed626a1253248'),
    new LocationModel('Cinnamon Grand Colombo', 6.917900, 79.848445, '4bd10754b221c9b66c02d5d0')
];

/**
 * LocationDetailModel consists of detailed information which is shown when the
 * detail views are requested
 */
var locationDetailModel = {
    locationName:'',
    bestPhoto: '',
    phone: '',
    detailSource: '',
    address: '',
};

/**
 * This is the view model that is responsibe for list view, search view and other
 * controll related tasks
 */
var ControlAreaViewModel = function () {
    var self = this;
    self.searchText = ko.observable("");
    self.locations = ko.observableArray(dataPoints);
    self.openMenu = ko.observable(false);

    // Search menu open
    openSearchMenu = function(){
        $('.content').css('height','100%');
       self.openMenu(true);
    };

    // Search menu close
    closeSearchMenu = function(){
        $('.content').css('height','90%');
        self.openMenu(false);
    };

    // callback when clicked on list view
    onSearchResultClick = function (locationModel) {
        closeSearchMenu(); // close the search menu other wise UX will not be better
        fourSquareHandler.getDetails(locationModel);
    };

    // callback when detailed results are retreived from FourSquare API 
    self.onLocationDetailModelUpdate = function (locationDetailModel) {
        // After getting details from Foursquare API  trigger the detail view with google map handler

      var content= " <a href="+locationDetailModel.detailSource+" target='_blank'><img src='img/foursquare.png' class='foursquare-icon' /> </a>"+
       
       " <div class='location-name'>"+locationDetailModel.locationModel.name+"</div>"+
        "<img class='best-photo' src='"+locationDetailModel.bestPhoto+"' />"+
        "<div class='address'>"+locationDetailModel.address+"</div>"+
        "<div class='phone'>"+locationDetailModel.phone+"</div>";
        googleMapHandler.triggerLocationDetailView(content, locationDetailModel.locationModel);
    };

    // listen on search text and prepare new array to render and search index to load
    self.searchText.subscribe(function (searchText) {

        var searchResult = [];
        var searchIndex={};
        $.each(dataPoints, function (index, val) {
            if (self._isSearchTextFound(searchText,val.name)) {
                searchResult.push(val);
                searchIndex[val.position.lng+'_'+ val.position.lat] = val; // This index is kept for performance
                // reasons. For example if this is not kept complexity will be higher
                // when trying to re render the markers
            }
        });

        self.locations(searchResult);
        googleMapHandler.populateDataPoints(searchIndex);
        
    });

    //This method finds the text in a given text. Since this search string can reside anywhere
    //on the text, preference has been given for those that contain in very begining of each
    //word (splitted by space)
    self._isSearchTextFound = function (searchText, availableText) {
        var keywords = availableText.split(' ');
        var found =false;
        $.each(keywords, function (index, val) {
            //Check whether the searchText is included in the very begining of the text
            if (val.toLowerCase().indexOf(searchText.toLowerCase()) === 0) {
                found = true;
            }
        });

        return found;
    };
};

// Instantiate view models
//var locationDetailModel = new LocationDetailModel();
var controlAreaViewModel = new ControlAreaViewModel();

// Apply bindings for view models. Note that bindings are applied for certain
// parts of the UI.
ko.applyBindings(controlAreaViewModel, document.getElementById("control-area"));;/**
 * This handler is responsible to deal with all functionalities of google MAP API and
 * hence act has a wrapper for MAP API which communcates with Handler
 */
var GoogleMapHandler = function () {

    var initLocation = { lat: 6.9092478, lng: 79.856681 }; // Colombo
    //Initializes the map, infowindow, boundaries and populates data points
    var initMap = function () {
        map = _createNewMap();
        infoWindow = new google.maps.InfoWindow({});
        bounds = new google.maps.LatLngBounds();
        this.populateDataPoints();
        this.addEvenetHandlersToMap();
    };

    //This method will listen events in dom tree
    var addEvenetHandlersToMap = function () {
        infoWindow.addListener('closeclick', _closeInfoWindow.bind(infoWindow));        
        google.maps.event.addDomListener(window, 'resize', function () {
            map.fitBounds(bounds);
        });
    };

    // This method will add event listeners 
    var addEventListenersToMarker = function (locationModel) {
        locationModel.marker.addListener('click', _onClickMapMarker.bind(locationModel));
    };
    // This will populate the data points on the map as markers.
    // Filter is optional to apply. Filter is not available when the map is initialized
    var populateDataPoints = function (filter) {

        var marker;
        for (i = 0; i < dataPoints.length; i++) {
            var locationModel = dataPoints[i];

            if (!filter) {
                marker = _createMarker(locationModel);
                // set that marker inside the dataPoints array so that We can reuse
                // it later to pop up info window
                locationModel.marker = marker;
                this.addEventListenersToMarker(locationModel);
            } else {
                marker = locationModel.marker;
                //if a filter is applied check whether it is in filter index
                if (!filter[locationModel.position.lng + '_' + locationModel.position.lat]) {
                    //Not available in filter hence marker should be hidden
                    locationModel.marker.setVisible(false);
                } else {
                    // Otherwise it should be visible
                    locationModel.marker.setVisible(true);
                }
            }
            // extend the bounds
            bounds.extend(marker.position);
        }
        // fit relevant bounds
        map.fitBounds(bounds);
    };

    //This will trigger the detailed view and make the marker animated
    var triggerLocationDetailView = function (content, locationModel) {
        if (infoWindow.marker !== locationModel.marker) {
            if (infoWindow.marker) {
                //if existing marker is available close it
                infoWindow.marker.setAnimation(null);
                infoWindow.marker = null;
            }           
            infoWindow.marker = locationModel.marker;
            _centerMap(locationModel);   // This will center the map to the given location    
            infoWindow.marker.setAnimation(google.maps.Animation.BOUNCE);
            infoWindow.setContent(content);
            infoWindow.open(map, locationModel.marker);
        }
    };

    //This will create a new map
    var _createNewMap = function () {
        return new google.maps.Map($('#map')[0], {
            center: initLocation,
            zoom: 8,
            mapTypeControl: false
        });
    };

    // This will return a new instance of marker
    var _createMarker = function (locationModel) {
        return new google.maps.Marker({
            position: locationModel.position,
            draggable: true,
            animation: google.maps.Animation.DROP,
            map: map,
            title: locationModel.name
        });
    };

    // This is the callback when clicked on the map marker
    var _onClickMapMarker = function () {
        fourSquareHandler.getDetails(this);
    };

    //This is the callback when clicked on close icon detailed view
    var _closeInfoWindow = function () {
        this.marker.setAnimation(null);
        this.marker = null;// setting it null to make sure new marker is set next time
    };

    //Handling the error with Map API
    var handleMapError = function () {
        alert('Google Maps Error. Please check configuration for loading google maps');
    };

    var _centerMap =function(locationModel){
        window.setTimeout(function(){
            map.setCenter(locationModel.marker.getPosition());
            map.panTo(locationModel.marker.getPosition());   
            map.setZoom(16);                
            
        }, 500); 
    };

    //Public API of the handler
    return {
        map: null,
        infoWindow: null,
        bounds: null,
        initLocation: initLocation,
        addEvenetHandlersToMap: addEvenetHandlersToMap,
        addEventListenersToMarker: addEventListenersToMarker,
        initMap: initMap,
        populateDataPoints: populateDataPoints,
        triggerLocationDetailView: triggerLocationDetailView,
        handleMapError: handleMapError,
    };
};

var googleMapHandler = new GoogleMapHandler();;/**
 * This API deals with the Foursquare Web service inorder to fetch detailed
 * information
 */
var FourSquareHandler = function () {

    //Config Properties for foursquare API
    var endPoint = 'https://api.foursquare.com/v2/venues/';
    var client_id = 'GHBSVU3SHG14OOJ4A5ICR0X04HGAETGF3U1LP2RHRR3ZFWTR';
    var client_secret = 'XZDHWHZDPSODIZN3ARGDKUKWXCCHUQEJ1A1F2O2032LD3VHT';
    var version = '20170801';

    //This function will get the details for a given location model
    var getDetails = function (locationModel) {

        $.ajax({
            type: "GET",
            url: this.endPoint + locationModel.fourSquareId,// prepare url
            dataType: "json",
            cache: false,
            locationModel: locationModel,
            data: {
                client_id: this.client_id,
                client_secret: this.client_secret,
                v: this.version,
            },
            success: function (data) {
                // Check whether the response is valid. If so, notify view model
                // if not valid call handle error
                var validatedResponse = _validateResponse(data);
                if (!validatedResponse.error) {
                    _notifyViewModel(data, this.locationModel);
                } else {
                    _handleError(validatedResponse.message);
                }
            },
            error: function (request, status, error) {
                var message;
                if (error) {
                    status = status || 'Not Specified';
                    message = 'Error status: ' + status + '     Message: ' + error;
                } else {
                    message = "Unknown Error occured";
                }

                _handleError(message);
            }

        });
    };

    // This should handle all errors network or invalid response
    var _handleError = function (message) {
        console.error(message); // log it on console
        alert(message);// notify to user;
    };

    // This will validate the response.
    var _validateResponse = function (data) {

        var validation = { error: true, message: '' };

        if (!data) {
            validation.message = 'No Data Object';
        } else if (!data.meta) {
            validation.message = 'No Meta Object';
        }
        else if (!data.meta.code) {
            validation.message = 'No Code Avaialable';
        }
        else if (!data.response) {
            validation.message = 'No Response Object';
        }
        else if (!data.response.venue) {
            validation.message = 'No Venu information on response Object';
        }
        else {
            validation.error = false;
        }
        return validation;
    };

    var formatToHTMLAddress =  function(unformattedAdressArray){
        var address = '';
        $.each(unformattedAdressArray, function (index, val) {
            address = address + '<br>' + val;
        });
        return address;
    };

    // This will notify the view model when the detail data is ready.
    var _notifyViewModel = function (data, locationModel) {
        var venue = data.response.venue;

        locationDetailModel.locationModel=locationModel;
        if(venue.bestPhoto.prefix && venue.bestPhoto.suffix){
            locationDetailModel.bestPhoto=venue.bestPhoto.prefix + "height60" + venue.bestPhoto.suffix;
        }else{
            locationDetailModel.bestPhoto='img/foursquare.png';            
        }
        locationDetailModel.phone=venue.contact.phone || 'No Phone provided';
        locationDetailModel.detailSource=venue.canonicalUrl || 'https://foursquare.com/';

        if(venue.location && venue.location.formattedAddress && venue.location.formattedAddress.length>0){
            locationDetailModel.address=formatToHTMLAddress(venue.location.formattedAddress);            
        }else{
            locationDetailModel.address=formatToHTMLAddress(['No Address','provided']);                        
        }
        controlAreaViewModel.onLocationDetailModelUpdate(locationDetailModel);
    };

    // Public API to access FourSquare Handler methods
    return {
        endPoint: endPoint,
        client_id: client_id,
        client_secret: client_secret,
        version: version,
        getDetails: getDetails
    };
};

var fourSquareHandler = new FourSquareHandler();