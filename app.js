var customInsidePolygonMarkerIcon = tomtom.L.icon({
	iconUrl: 'img/inside_marker.png',
	iconSize: [40, 46],
	iconAnchor: [20, 46]
});

var customOutsideMarkerIcon = tomtom.L.icon({
	iconUrl: 'img/outside_marker.png',
	iconSize: [40, 46],
	iconAnchor: [20, 46]
});

var SEARCH_QUERY = 'Amsterdam';

var markerCoordinates = [
	[4.899431, 52.379189],
	[4.8255823, 52.3734312],
	[4.7483138, 52.4022803],
	[4.797049, 52.435065],
	[4.885911, 52.320235]
];

var map = tomtom.L.map('map', {
	key: '<your-api-key',
	source: 'raster'
});

tomtom.controlPanel({
	position: 'topright',
	collapsed: false,
	close: null,
	closeOnMapClick: false
}).addTo(map).addContent(document.getElementById('polygon-info-box'));

findGeometry();

function findGeometry() {
	tomtom.fuzzySearch({
			idxSet: "Geo"
		})
		.query(SEARCH_QUERY)
		.go()
		.then(getAdditionalData);
}

function getAdditionalData(fuzzySearchResults) {
	var geometryId = fuzzySearchResults[0].dataSources.geometry.id;
	tomtom.additionalData({
			geometries: [geometryId],
			geometriesZoom: 12
		})
		.go()
		.then(processAdditionalDataResponse);
}

function processAdditionalDataResponse(additionalDataResponse) {
	if (additionalDataResponse.additionalData && additionalDataResponse.additionalData.length) {
		var geometryData = displayPolygonOnTheMap(additionalDataResponse.additionalData[0]);
		calculateTurfArea(geometryData);
		drawPointsInsideAndOutsideOfPolygon(geometryData);
	}
}

function displayPolygonOnTheMap(additionalDataResult) {
	var geometryData = additionalDataResult.geometryData.features[0].geometry;
	var geoJsonLayer = tomtom.L.geoJson(geometryData, {
		style: {
			color: '#2FAAFF',
			opacity: 0.8
		}
	}).addTo(map);
	map.fitBounds(geoJsonLayer.getBounds());
	return geometryData;
}

function calculateTurfArea(geometryData) {
	var areaInMeters = turf.area(geometryData);
	var areaInKilometers = turf.round(turf.convertArea(areaInMeters, 'meters', 'kilometers'),2); 
	var areaInfo = document.getElementById('area-info');
	areaInfo.innerText = areaInKilometers;
	var areaInfoWrapper = document.getElementsByClassName('tomtom-control-panel')[0];
	areaInfoWrapper.style.visibility = "visible";
}

function drawPointsInsideAndOutsideOfPolygon(geometryData) {
	var turfPolygon = turf.polygon(geometryData.coordinates);
	var points = turf.points(markerCoordinates);
	var pointsWithinPolygon = turf.pointsWithinPolygon(points, turfPolygon);
	markerCoordinates.forEach(function (markerCoordinate) {
		var marker = tomtom.L.marker(L.GeoJSON.coordsToLatLng(markerCoordinate));
		marker.setIcon(customOutsideMarkerIcon);
		pointsWithinPolygon.features.forEach(function (pointWithinPolygon) {
			if (markerCoordinate[0] === pointWithinPolygon.geometry.coordinates[0] &&
				markerCoordinate[1] === pointWithinPolygon.geometry.coordinates[1]) {
				marker.setIcon(customInsidePolygonMarkerIcon);
			}
		});
		marker.addTo(map);
	});
}