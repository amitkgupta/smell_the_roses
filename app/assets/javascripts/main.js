var map;
var directionsService;
var placesService;
var markers;
var geocoder;
		
function initialize() {
  	var sanFrancisco = new google.maps.LatLng(37.7750, -122.4183);
	var myOptions = {
		zoom:11,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		center: sanFrancisco
	}
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	directionsService = new google.maps.DirectionsService();
	placesService = new google.maps.places.PlacesService(map);
	markers = [];
	geocoder = new google.maps.Geocoder();
}

function centerMap(start) {
	var geocoderRequest = {
		address: start
	}
	
	geocoder.geocode(geocoderRequest, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			map.setCenter(results[0].geometry.location);
		}
	});
}

function showPOIs() {
	markers.forEach(function(marker) {
		marker.setMap(null);
	});
							
	var start = document.getElementById("start").value;
	var end = document.getElementById("end").value;
	var poi = document.getElementById("poi").value;
	var walk = document.getElementById("walk").value;
	var searchPoints = [];
	
	centerMap(start);
	
	var routeRequest = {
		origin: start,
		destination: end,
		travelMode: google.maps.TravelMode.TRANSIT
	}
	  			
	directionsService.route(routeRequest, function(routeResults, status) {
		if(status == google.maps.DirectionsStatus.OK) {
			var steps = routeResults.routes[0]['legs'][0]['steps'];

			steps.forEach(function(step) {
				if (step.travel_mode == "WALKING") {
					if ($.inArray(step.start_location, searchPoints) == -1) {
						searchPoints.push(step.start_location);
					}
					if ($.inArray(step.end_location, searchPoints) == -1) {
						searchPoints.push(step.end_location);
					}
				}
			});
				
			searchPoints.forEach(function(point) {
				var searchRequest = {
					location: point,
					radius: walk,
					name: poi
				}
							
				placesService.search(searchRequest, function(searchResults, status) {
					if (status == google.maps.places.PlacesServiceStatus.OK) {
						searchResults.forEach(function(result) {
							var marker = new google.maps.Marker({
								map: map,
								position: result.geometry.location
							});
							markers.push(marker);
						});
					}
				});
			});
				
			searchPoints = [];
		}
	});
}