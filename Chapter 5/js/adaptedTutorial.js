
const map = L.map('mapid').setView([0, 0], 3);

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(map);

function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

function getData(){
    fetch("data/TheBigCities.geojson")
            .then(function(response){
                return response.json();
            })
            .then(function(json){
                let geojsonMarkerOptions = {
                    radius: 8,
                    fillColor: "#ff7800",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                };

                L.geoJson(json,{
                    pointToLayer: function(feature, latlng) {
                        return L.circleMarker(latlng, geojsonMarkerOptions);
                    },

                }).addTo(map);
            })
            .then(function(json){
                //create a Leaflet GeoJSON layer and add it to the map
                L.geoJson(json, {
                    onEachFeature: onEachFeature
                }).addTo(map);
        })
}

getData();
