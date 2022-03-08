var map;
var minValue;

function createMap(){

    //create the map
    map = L.map('mapid', {
        center: [0, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
    }).addTo(map);

    //call getData function
    getData(map);
};
//calculates the min value that the circle size can be in comparison to the data
function calculateMinValue(json){
    var allValues = [];
//loop that scans through the values in the Tree_Coverage features    
    for(var Country of json.features){
        for(var year = 2014; year <= 2020; year += 1){
            var value = Country.properties["Coverage_" + String(year)];
            allValues.push(value);
        };
    };

    var minValue = Math.min(...allValues)
    console.log(minValue);

    return minValue;
};
//calculates the radius of the circle depending on the value in the Tree_Coverage feature
function calcPropRadius(attValue){
    var minRadius = 5;
    var radius = 1.0083 * Math.pow(Math.abs(attValue)/minValue, 0.5715) * minRadius

    return radius;
};
//applies circle to point and makes it a different color and opacity
function pointToLayer(feature, latlng, attributes) {
    var attribute = attributes[0]; 

    if(attValue < 0) {

        attributes = Math.abs(attributes)

        var geojsonMarkerOptions = {
            fillColor: "#ff0000",
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
            radius: 8
        };
    
        var attValue = Number(feature.properties[attribute]);
    
        geojsonMarkerOptions.radius = calcPropRadius(attValue);
    
        var layer = L.circleMarker(latlng, geojsonMarkerOptions);
        var popupContent = "<p><b>Country:</b> " + feature.properties.Country + "</p>";
        var year = attribute.split("_")[1];
    
        popupContent += "<p><b>Tree Coverage in " + year + ":</b> " + feature.properties[attribute] + " million Hectacres</p>";
    
        layer.bindPopup(popupContent, {
            offset: new L.Point(1,-geojsonMarkerOptions.radius) 
        });
    
        return layer;
    
    //creates proportiuonal symbols for the values of trees in millions of hectacres
    function createPropSymbols(json, attributes){
    
        L.geoJson(json,{
            pointToLayer: function(feature, latlng){
                return pointToLayer(feature, latlng, attributes);
            } 
        }).addTo(map);
    };
    //processes the data from the TreeCoverage.geojson
    function processData(json){
        var attributes = [];
        var properties = json.features[0].properties;
    //loop that displays only objects that contain the word coverage in it so that the country name is not included
        for(var attribute in properties){
            if(attribute.indexOf("Coverage") > -1){
                attributes.push(attribute);
            };
        };
    
        console.log(attributes);
    
        return attributes;
    };
} 
    else {
    var geojsonMarkerOptions = {
        fillColor: "#00ff00",
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        radius: 8
    };

    var attValue = Number(feature.properties[attribute]);

    geojsonMarkerOptions.radius = calcPropRadius(attValue);

    var layer = L.circleMarker(latlng, geojsonMarkerOptions);
    var popupContent = "<p><b>Country:</b> " + feature.properties.Country + "</p>";
    var year = attribute.split("_")[1];

    popupContent += "<p><b>Tree Coverage in " + year + ":</b> " + feature.properties[attribute] + " million Hectacres</p>";

    layer.bindPopup(popupContent, {
        offset: new L.Point(1,-geojsonMarkerOptions.radius) 
    });

    return layer;

//creates proportiuonal symbols for the values of trees in millions of hectacres
function createPropSymbols(json, attributes){

    L.geoJson(json,{
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        } 
    }).addTo(map);
};
//processes the data from the TreeCoverage.geojson
function processData(json){
    var attributes = [];
    var properties = json.features[0].properties;
//loop that displays only objects that contain the word coverage in it so that the country name is not included
    for(var attribute in properties){
        if(attribute.indexOf("Coverage") > -1){
            attributes.push(attribute);
        };
    };

    console.log(attributes);

    return attributes;
};
};
};
//creates the slide and button functions
function createSequenceControls(attributes){
    var slider = "<input class = 'range-slider' type = 'range'></input>"
    document.querySelector("#panel").insertAdjacentHTML('beforeend', slider);

    document.querySelector('.range-slider').max = 6;
    document.querySelector('.range-slider').min = 0;
    document.querySelector('.range-slider').value = 0;
    document.querySelector('.range-slider').step = 1;
//creating the buttons
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse"></button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward"></button>');
//applying the reverse and forward arrow images to the buttons
    document.querySelector('#reverse').insertAdjacentHTML('beforeend','<img src="img/reverse.png">');
    document.querySelector('#forward').insertAdjacentHTML('beforeend','<img src="img/forward.png">');
//adds a listener for the clicking of the button
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click",function(){
            var index = document.querySelector('.range-slider').value;

            if (step.id == 'forward'){
                index++;

                index = index > 6 ? 0 : index;
            } else if (step.id == 'reverse') {
                index--;

                index = index < 0 ? 6 : index;
            };

            document.querySelector('.range-slider').value = index;

            updatePropSymbols(attributes[index]);
        });
    });

    document.querySelector('.range-slider').addEventListener('input', function(){
        var index = this.value;

        updatePropSymbols(attributes[index]);
    });

};

function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){

            var props = layer.feature.properties;

            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            var popupContent = "<p><b>Country:</b> " + props.Country + "</p>";

            var year = attribute.split("_")[1];
            popupContent += "<p><b>Tree Coverage in " + year + ":</b> " + props[attribute] + " million Hectacres</p>";

            popup = layer.getPopup();
            popup.setContent(popupContent).update();
        };
    });
};
//gets the data from the TreeCovereage file to use
function getData(attributes){
    fetch("data/TreeCoveragePercentage.geojson")
            .then(function(response){
                return response.json();
            })
            .then(function(json){
                var attributes = processData(json);
                minValue = calculateMinValue(json);

                createPropSymbols(json, attributes);
                createSequenceControls(attributes);
            });
};

document.addEventListener('DOMContentLoaded',createMap)