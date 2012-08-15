var map;
var directionsService;
var placesService;
var markers;
var markerPositions;
var geocoder;
var directionsRenderer;
var routeRequest;

var start, end, poi, deviation, travelMode;
		
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
	markerPositions = [];
	geocoder = new google.maps.Geocoder();
	directionsRenderer = new google.maps.DirectionsRenderer({map: map});
}

function showPOIs() {
	prepareRouteRequest();							
	directionsService.route(routeRequest, function(routeResults, status) {
		var steps = routeResults.routes[0]['legs'][0]['steps'];
		renderRouteResults(steps, routeResults);
		buildSearchPoints(steps).forEach(function(point) {
			addMarkersNearPoint(point);
		});
	});
}

function prepareRouteRequest() {
	start = document.getElementById("start").value;
	end = document.getElementById("end").value;
	poi = document.getElementById("poi").value;
	deviation = document.getElementById("deviation").value;
	travelMode = document.getElementById("travelMode").value;
	routeRequest = {
		origin: start,
		destination: end,
		travelMode: travelMode 
	}
}

function renderRouteResults(steps, routeResults) {
	var bounds = new google.maps.LatLngBounds();
	bounds.extend(steps[0].start_location);
	bounds.extend(steps[steps.length-1].end_location);			
	resetMarkers();
	directionsRenderer.setDirections(routeResults);
	resetMap(bounds);
}

function resetMarkers() {
	markers.forEach(function(marker) {
		marker.setMap(null);
	});
	markers = [];
	markerPositions = [];
}

function resetMap(bounds) {
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

function addMarkersNearPoint(point) {
	var searchRequest = {
		location: point,
		radius: deviation,
		name: poi
	}					
	placesService.search(searchRequest, function(searchResults, status) {
		searchResults.forEach(function(result) {
			if ($.inArray("result.geometry.location", markerPositions) == -1) {
				addMarker(result.geometry.location, result.name, result.rating);
			}
		});
	});
}

function addMarker(location, name, rating) {
	var marker = new google.maps.Marker({
		map: map,
		position: location,
		title: name.concat(" (rating: ").concat(rating).concat(")")
	});
	markers.push(marker);
	markerPositions.push(location);
	if (travelMode != "TRANSIT") { addListenerToMarker(marker); }
}

function addListenerToMarker(marker) {
	google.maps.event.addListener(marker, 'click', function() {
		routeRequest.waypoints = [{location: marker.getPosition()}]
		directionsService.route(routeRequest, function(routeResults, status) {
			directionsRenderer.setDirections(routeResults);
		});
	});
}