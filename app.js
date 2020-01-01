var apiKey = 'YOUR_API_KEY';

var SEARCH_QUERY = 'Amsterdam';

var markerCoordinates = [
	[4.899431, 52.379189],
	[4.8255823, 52.3734312],
	[4.7483138, 52.4022803],
	[4.797049, 52.435065],
	[4.885911, 52.320235]
];

var map = tt.map({
	key: apiKey,
	container: 'map',
	center: [4.899431, 52.379189],
	style: 'tomtom://vector/1/basic-main',
	zoom: 10
});

findGeometry();

function findGeometry() {
	tt.services.fuzzySearch({
			key: apiKey,
			query: SEARCH_QUERY
		})
		.go()
		.then(getAdditionalData);
}

function getAdditionalData(fuzzySearchResults) {
	var geometryId = fuzzySearchResults.results[0].dataSources.geometry.id;
	tt.services.additionalData({
		key: apiKey,
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
function buildLayer(id, data) {
	return {
		'id': id,
		'type': 'fill',
		'source': {
			'type': 'geojson',
			'data': {
				'type': 'Feature',
				'geometry': {
					'type': 'Polygon',
					'coordinates': data
				}
			}
		},
		'layout': {},
		'paint': {
			'fill-color': '#2FAAFF',
			'fill-opacity': 0.8,
			'fill-outline-color': 'black'
		}
	}
}
function displayPolygonOnTheMap(additionalDataResult) {
	var geometryData = additionalDataResult.geometryData.features[0].geometry.coordinates[0];
	map.addLayer(buildLayer('fill_shape_id', geometryData));	
	return geometryData;
}

function calculateTurfArea(geometryData) {
	var turfPolygon = turf.polygon(geometryData);
	var areaInMeters = turf.area(turfPolygon);
	var areaInKilometers = turf.round(turf.convertArea(areaInMeters, 'meters', 'kilometers'), 2); 
	var areaInfo = document.getElementById('area-info');
	areaInfo.innerText = areaInKilometers;
	var areaInfoWrapper = document.getElementsByClassName('tomtom-control-panel')[0];
}

function createMarkerElementInnerHTML(icon) {
	var width = 40;
	var height = 47;
	return "<img src='" + icon + "' style='width: " + width + "px; height: " + height + "px';>";
}

function drawPointsInsideAndOutsideOfPolygon(geometryData) {
	var customInsidePolygonMarkerIcon = 'img/inside_marker.png';
	var customOutsideMarkerIcon = 'img/outside_marker.png';
	var turfPolygon = turf.polygon(geometryData);
	var points = turf.points(markerCoordinates);
	var pointsWithinPolygon = turf.pointsWithinPolygon(points, turfPolygon);
	markerCoordinates.forEach(function (markerCoordinate) {
		const markerElement = document.createElement('div');
		markerElement.innerHTML = createMarkerElementInnerHTML(customOutsideMarkerIcon);
		pointsWithinPolygon.features.forEach(function (pointWithinPolygon) {
			if (markerCoordinate[0] === pointWithinPolygon.geometry.coordinates[0] &&
				markerCoordinate[1] === pointWithinPolygon.geometry.coordinates[1]) {
					markerElement.innerHTML = createMarkerElementInnerHTML(customInsidePolygonMarkerIcon);
			}
		});
		var marker = new tt.Marker({ element: markerElement}).setLngLat(markerCoordinate);
		marker.addTo(map);
	});
}