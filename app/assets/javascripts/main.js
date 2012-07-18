var map;
var directionsService;
var placesService;
var markers;
var geocoder;
var directionsRenderer;
var routeRequest;
		
function initialize() {
  	var sanFrancisco = new google.maps.LatLng(37.7750, -122.4183);
	var myOptions = {
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		zoom: 11,
		center: sanFrancisco
	}
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	directionsService = new google.maps.DirectionsService();
	placesService = new google.maps.places.PlacesService(map);
	markers = [];
	geocoder = new google.maps.Geocoder();
	directionsRenderer = new google.maps.DirectionsRenderer({map: map});
}

function resetMarkers() {
	markers.forEach(function(marker) {
		marker.setMap(null);
	});
	markers = [];
}

function resetMap(bounds, deviation) {
	var south = bounds.getSouthWest().lat()-(deviation/100000);
	var west = bounds.getSouthWest().lng()-(deviation/100000);
	var north = bounds.getNorthEast().lat()+(deviation/100000);
	var east = bounds.getNorthEast().lng()+(deviation/100000);
	var newSouthWest = new google.maps.LatLng(south,west);
	var newNorthEast = new google.maps.LatLng(north,east);
	bounds.extend(newSouthWest);
	bounds.extend(newNorthEast);
	map.fitBounds(bounds);
}

function showPOIs() {
	resetMarkers();
							
	var start = document.getElementById("start").value;
	var end = document.getElementById("end").value;
	var poi = document.getElementById("poi").value;
	var deviation = document.getElementById("deviation").value;
	var travelMode = document.getElementById("travelMode").value;
	var searchPoints = [];
	
	routeRequest = {
		origin: start,
		destination: end,
		travelMode: travelMode 
	}
	  			
	directionsService.route(routeRequest, function(routeResults, status) {
		if(status == google.maps.DirectionsStatus.OK) {
			directionsRenderer.setDirections(routeResults);
		
			var steps = routeResults.routes[0]['legs'][0]['steps'];
			var bounds = new google.maps.LatLngBounds();
			bounds.extend(steps[0].start_location);
			bounds.extend(steps[steps.length-1].end_location);
			
			resetMap(bounds, deviation);

			searchPoints = buildSearchPoints(steps);
				
			searchPoints.forEach(function(point) {
				addMarkersNearPoint(point, deviation, poi);
			});
		}
	});
}

function buildSearchPoints(steps) {
	var searchPoints = [];
	searchPoints.push(steps[0].start_location);
	searchPoints.push(steps[steps.length-1].end_location);
	
	for (i=0; i < steps.length-1; i++) {
		if (steps[i].travel_mode != "TRANSIT") {
			searchPoints.push(steps[i].start_location);
			if (steps[i+1] == "TRANSIT") {
				searchPoints.push(steps[i].end_location);
			}
		}
	}

	return searchPoints;
}

function addMarkersNearPoint(point, deviation, poi) {
	var searchRequest = {
		location: point,
		radius: deviation,
		name: poi
	}
							
	placesService.search(searchRequest, function(searchResults, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			searchResults.forEach(function(result) {
				addMarker(result);
			});
		}
	});
}

function addMarker(place) {
	var positions = markers.map(function(marker) {marker.position;});
	if ($.inArray("place.geometry.location", positions) == -1) {
		var marker = new google.maps.Marker({
			map: map,
			position: place.geometry.location,
			title: place.name.concat(" (rating: ").concat(place.rating).concat(")")
		});

		markers.push(marker);
		
		google.maps.event.addListener(marker, 'click', function() {
   			routeRequest.waypoints = [{location: marker.position}]
   			directionsService.route(routeRequest, function(routeResults, status) {
				if(status == google.maps.DirectionsStatus.OK) {
					directionsRenderer.setDirections(routeResults);
				}
			});
		});
	}
}