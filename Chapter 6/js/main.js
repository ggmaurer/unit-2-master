var map;
var dataStats = {};
var minValue;

function createMap(){

    //create the map
    map = L.map('mapid', {
        center: [10, 30],
        zoom: 2.4
    });

    //add OSM base tilelayer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
    }).addTo(map);

    //call getData function
    getData(map);
};

function calcStats(json){
    var allValues = [];
    for(var Country of json.features){
        for(var year = 2014; year <= 2020; year += 1){
            var value = Country.properties["Coverage_" + String(year)];
            allValues.push(Math.abs(value));  
        }
    }
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    
    var sum = allValues.reduce(function(a,b) {return a+b;});
    dataStats.mean = sum/ allValues.length

    console.log(dataStats);
}



//calculates the min value that the circle size can be in comparison to the data
function calculateMinValue(json){
    var allValues = [];
//loop that scans through the values in the Tree_Coverage features    
    for(var Country of json.features){
        for(var year = 2014; year <= 2020; year += 1){
            var value = Country.properties["Coverage_" + String(year)];
            allValues.push(Math.abs(value));
        };
    };
    

    var minValue = Math.min(...allValues)
    
    return minValue;
};
//calculates the radius of the circle depending on the value in the Tree_Coverage feature
function calcPropRadius(attValue){
    var minRadius = 5;
    var radius = 0.5 * Math.pow(Math.abs(attValue)/minValue, 0.5715) * minRadius

    return radius;
};
//applies circle to point and makes it a different color and opacity
function pointToLayer(feature, latlng, attributes) {
    var attribute = attributes[0]; 

    var geojsonMarkerOptions = {
        fillColor: "#ff7800",
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.5,
        radius: 8
    };

    var attValue = Number(feature.properties[attribute]);

    geojsonMarkerOptions.radius = calcPropRadius(attValue);

    if(feature.properties[attribute] < 0) {
        geojsonMarkerOptions.fillColor = "#ff0000";
    }
    else {
        geojsonMarkerOptions.fillColor = "#00ff00";
    }

    var layer = L.circleMarker(latlng, geojsonMarkerOptions);
    var popupContent = "<p><b>Country:</b> " + feature.properties.Country + "</p>";
    var year = attribute.split("_")[1];

    popupContent += "<p><b>Percent Change in Forest Density in " + year + ":</b> " + feature.properties[attribute] + "% Since 2013</p>";

    layer.bindPopup(popupContent, {
        offset: new L.Point(1,-geojsonMarkerOptions.radius) 
    });

    return layer;
};
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
//creates the slide and button functions
function createSequenceControls(attributes){

    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function() {
            var container = L.DomUtil.create('div', 'sequence-control-container');

            container.insertAdjacentHTML('beforeend', '<input class = "range-slider" type="range">')

            container.insertAdjacentHTML('beforeend', '<button class = "step" id="reverse" title="Reverse"><img src = "img/reverse.png"></button>');
            container.insertAdjacentHTML('beforeend', '<button class = "step" id="forward" title="Forward"><img src = "img/forward.png"></button>');

            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl (new SequenceControl());

    document.querySelector(".range-slider").max = 6;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;
    
    var steps = document.querySelectorAll('.step');
    
    steps.forEach(function(step){
        step.addEventListener("click", function(){
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

                })
        })

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

            if(props[attribute] < 0) {
                layer.setStyle({
                    fillColor: "#ff0000"
                })

            }
            else {
                layer.setStyle({
                    fillColor: "#00ff00"
                })
            }

            var popupContent = "<p><b>Country:</b> " + props.Country + "</p>";

            var year = attribute.split("_")[1];
            popupContent += "<p><b> Percent Change in Forest Density in " + year + ":</b> " + props[attribute] + "% Since 2013</p>";

            popup = layer.getPopup();
            popup.setContent(popupContent).update();
        };
    });
};

function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: "bottomright"
        },
        onAdd: function(){
            var container = L.DomUtil.create('div', 'second-legend-control-container');

            var svg = '<svg id = "attribute-legend" width = "200px" height = "50px">';

            var circles = ["red"];

            var radius = 8;
            var cy = 20 - radius;

            svg += '<circle class = "legend-circle" id = "' + circles + '"r="' + radius + '"cy="' + cy + '" fill = "#00ff00" fill-opacity = "1" stroke = "#000000" cx = "13" />';

            var textY = 50 - 34;            

            svg += '<text id="' + circles + '"text" x="37" y="' + textY + '">' + " Increasing in Density" + '</text>'; 

            var circles = ["green"];

            var radius = 8;
            var cy = 45 - radius;

            svg += '<circle class = "legend-circle" id = "' + circles + '"r="' + radius + '"cy="' + cy + '" fill = "#ff0000" fill-opacity = "1" stroke = "#000000" cx = "14" />';
            
            var textY = 50 - 8;            

            svg += '<text id="' + circles + '"text" x="37" y="' + textY + '">' + " Decreasing in Density" + '</text>'; 

            svg += "</svg>";
            container.insertAdjacentHTML('beforeend', svg);

            return container;
        }
    });

    map.addControl(new LegendControl());

};

function createSecondLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: "bottomright"
        },
        onAdd: function(){
            var container = L.DomUtil.create('div', 'legend-control-container');

            container.innerHTML = '<p class = "temporalLegend">Tree Density Percentage from <span class "year"> 2014 to 2020 </span> <i> Since 2013 </i></p>';
            
            var svg = '<svg id = "attribute-legend" width = "225px" height = "175px">';

            //container.innerHTML += svg;

            var circles = ["max", "mean", "min"];

            for(var i=0; i<circles.length; i++){

                var radius = calcPropRadius(dataStats[circles[i]]);
                var cy = 155- radius;
                
                console.log(dataStats);

                svg += '<circle class = "legend-circle" id = "' + circles[i] + '"r="' + radius + '"cy="' + cy + '" fill = "#000000" fill-opacity = "0.5" stroke = "#000000" cx = "78" />';
            
                var textY = i * 50 + 37;            

                //text string            
                svg += '<text id="' + circles[i] + '"text" x="60" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + "%" + '</text>';
            
            };

            svg += "</svg>";

            container.insertAdjacentHTML('beforeend', svg);

            return container;
        }
    });

    map.addControl(new LegendControl());

};


//gets the data from the TreeCovereage file to use
function getData(attributes){
    fetch("data/TreeCoveragePercentage.geojson")
            .then(function(response){
                return response.json();
            })
            .then(function(json){
                calcStats(json);
                
                var attributes = processData(json);
                minValue = calculateMinValue(json);

                createPropSymbols(json, attributes);
                createSequenceControls(attributes);
                createLegend(attributes);
                createSecondLegend(attributes);
                
            });
};

document.addEventListener('DOMContentLoaded',createMap)