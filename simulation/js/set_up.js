var cost_sum = 0; //total ticket money collected by all buses
var people_sum = 0; //total number of passengers on the bus
var timeFactor = 1; //number of seconds per second/10
var ticket_data = {}; //contains raw ticket data from file
var gps_data = {}; //contains raw gps data from file
var cost_byid = {}; //total ticket money collected by each bus
var people_byid = {}; //total passenger count in each bus
var styleIcon = {}; //list of markers
var bunching_radius = 100; //radius of bunching
var bunched_vals = []; //number of bunching instances
var dist_travelled = {} //distance travelled by each bus

/*
Time Factor setting:
Function allows time slider and value to be in sync
*/
$(document).ready(function() {
    $('#timeFactorSlider').on('change', function() {
        $('#timeFactorText').val($('#timeFactorSlider').val());
        timeFactor = $('#timeFactorSlider').val() / 10;
    });

    $('#timeFactorText').on('keyup', function() {
        $('#timeFactorSlider').val($('#timeFactorText').val());
        timeFactor = $('#timeFactorText').val() / 10;
    });
});

function getFileNames(folder) {
    /*
    gets a list of file names in the particular route, 
    input: folder name
    output: promise with file names
    */
    return new Promise(function(resolve, reject) {
        var file = folder;
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, true);
        rawFile.responseType = "document";
        rawFile.onreadystatechange = function() {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    var dom = document.createElement('html');
                    dom = rawFile.response;
                    links = dom.links;
                    var link_vals = [];
                    for (var i = 0; i < links.length; i++) {
                        if (links[i]['innerHTML'] == ".DS_Store")
                        //.DS_Store is a MAC specific file
                            continue;
                        link_vals[links[i]['innerHTML']] = (links[i]['href']);
                    }
                    resolve(link_vals);
                }
            }
        }
        rawFile.send(null);
    });

    return promise;
}

function getData(data) {
    /*
    reads the data from a particular file, 
    input: file,
    output: returns promise with data value
    */
    return new Promise(function(resolve, reject) {
        var file = data;
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, true);
        rawFile.onreadystatechange = function() {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    var allText = rawFile.response;
                    data_text = Papa.parse(allText, { header: true });
                    resolve(data_text);
                }
            }
        }
        rawFile.send(null);
    });
}

function update_position(marker, pos, i) {
    /*
    function to update position of a marker,
    input: marker - marker, pos - new position, i - iteration number
    */
    pos_latlng = new google.maps.LatLng(pos['LAT'], pos['LONGITUDE']);
    marker.setPosition(pos_latlng);
    map.panTo(pos_latlng);
}

function update_ticket(ticket_data, i, key) {
    /*
    function to update ticket related values,
    updates total ticket amount, total number of passengers and 
    total ticket amount collected by that particular bus and total number of passengers in that bus
    input: ticket_data - new ticket data value, i - iteration number, key - bus key (file name)
    */
    cost_sum += parseInt(ticket_data['total_ticket_amount']);
    people_sum += parseInt(ticket_data['px_count']);
    cost_byid[key] += parseInt(ticket_data['total_ticket_amount']);
    people_byid[key] += parseInt(ticket_data['px_count']);
    if (i % timeFactor == 0) {
        //update values in html page
        document.getElementById("fare").innerHTML = cost_sum;
        document.getElementById('passenger').innerHTML = people_sum;
        document.getElementById(key).cells[1].innerHTML = cost_byid[key];
        document.getElementById(key).cells[2].innerHTML = people_byid[key];
    }
}

function iterate(map, gps_data, ticket_data) {
    /*
    Function that starts placing markers on the map and updates them and values every second
    !!! As of now when time factor becomes too much, function doesn't iterate fast enough, have to fix it
    */
    var keys = Object.keys(gps_data); //list of keys, each corresponding to a bus
    var len = keys.length; //number of keys
    markers = {};
    var time_vals = [] //list of labels used in the chart below
    for (var i = 2; i < 8641; i++) {
        time_vals.push(i);
    }

    //initialise map and values on html page
    var bangalore = new google.maps.LatLng(12.9716, 77.5946);
    var marker_set = function(i, num) {
        /*
        Creates a marker for each bus
        input: i - key number, num - index number of buses
        */
        styleIcon[i] = new StyledIcon(StyledIconTypes.MARKER, { color: "#ff0000", text: String(num) });
        markers[i] = new StyledMarker({
            styleIcon: styleIcon[i],
            position: bangalore,
            map: map
        });
        cost_byid[i] = 0;
        people_byid[i] = 0;
        dist_travelled[i] = 0;
        var table = document.getElementById("bus_data");
        var row = table.insertRow(-1);
        row.id = i;
        row.classList.add('unbunched');
        row.insertCell(0).innerHTML = num;
        row.insertCell(1).innerHTML = 0;
        row.insertCell(2).innerHTML = 0;
    };
    document.getElementById('bunched_no').innerHTML = bunched_vals.length;

    $(function() {
        /*
        Setting markers
        */
        for (var i = 0; i < len; i++) {
            marker_set(keys[i], i);
        }
    })

    //data for the graph, updated every iteration
    var graph_data = {
        labels: time_vals,
        datasets: [],
    }

    /*
    Create a different line for each bus
    */
    for (var i = 0; i < len; i++) {
        graph_data.datasets.push({
            borderColor: "rgba(" + (i * 13) % 255 + "," + (i * 11) % 255 + "," + (i * 17) % 255 + ",0.5)",
            data: [],
            label: i.toString()
        });
    }

    var addData = function(to_add_vals) {
        /*
        Adds data to the graph
        */
        myNewChart.config.labels.push(to_add_vals['label']);
        for (var i = 0; i < len; i++) {
            myNewChart.config.data.datasets[i].data.push(to_add_vals['vals'][i]);
        }
    }

    /*
    Setting up graph below
    */
    var ctx = document.getElementById('distance_time').getContext("2d");
    var options = {
        animation: false,
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'time'
                },
                ticks: {
                    display: true, //this will remove only the label
                    fontColor: 'white'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Distance Covered From Starting Point',
                    fontColor: 'white',
                    max: 30,
                    min: -30
                },
                ticks: {
                    fontColor: 'white'
                }
            }]
        },
        legend: {
            labels: {
                fontColor: 'white'
            }
        }
    }

    //Initialise the chart
    var myNewChart = new Chart(ctx, {
        type: 'line',
        labels: [],
        data: graph_data,
        options: options
    });


    function check_vals(other_key, key, i, shortest_dist, shortest_index) {
        /*
        Calculates distance between key and other key,
        used to calculate shortest distance between markers
        */
        dist = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(gps_data[key].data[i]['LAT'], gps_data[key].data[i]['LONGITUDE']), new google.maps.LatLng(gps_data[other_key].data[i]['LAT'], gps_data[other_key].data[i]['LONGITUDE']));
        if ((key != other_key) && (dist < shortest_dist) && (ticket_data[key].data[i]['route_direction'] !== 'NA') && (ticket_data[other_key].data[i]['route_direction'] !== 'NA') && (ticket_data[key].data[i]['route_direction'] == ticket_data[other_key].data[i]['route_direction'])) { //change comparison!!!
            shortest_dist = dist;
            shortest_index = other_key;
        }
        return [shortest_dist, shortest_index];
    }

    function dist_calc(key, i) {
        /*
        Calculates shortest distance at each iteration
        */
        var shortest_dist = Math.pow(10, 1000);
        var shortest_index;
        new Promise(function(resolve, reject) {
                for (var other_key in gps_data) {
                    [shortest_dist, shortest_index] = (check_vals(other_key, key, i, shortest_dist, shortest_index));
                }
                resolve();
            })
            .then(function() {
                if (shortest_dist < bunching_radius) {
                    var val_1 = key + ticket_data[key].data[i]['trip_no'] + ticket_data[key].data[i]['route_direction'];
                    var val_2 = shortest_index + ticket_data[shortest_index].data[i]['trip_no'] + ticket_data[shortest_index].data[i]['route_direction'];
                    if (!(bunched_vals.includes(val_1 + ' ' + val_2)) && !(bunched_vals.includes(val_2 + ' ' + val_1))) {
                        bunched_vals.push(val_1 + ' ' + val_2);
                        document.getElementById('bunched_no').innerHTML = bunched_vals.length;
                    }
                    styleIcon[key].set('color', '#00ff00');
                    document.getElementById(key).classList.add('bunched');
                    document.getElementById(key).classList.remove('unbunched');
                } else {
                    styleIcon[key].set('color', '#ff0000');
                    document.getElementById(key).classList.add('unbunched');
                    document.getElementById(key).classList.remove('bunched');
                }
            });
    }
    var internalCallback = function(i) {
        /*
        Function that updates all values every second
        */
        return function() {
            if (i < 8641) { //hardcoded value for number of 10 seconds segment in a day
                console.log(i);
                if (i % timeFactor == 0) {
                    //(function() {
                    for (var key in gps_data) {
                        update_position(markers[key], gps_data[key].data[i], i);
                    }
                    //})();
                }
                for (var key in gps_data) {
                    dist_calc(key, i);
                }
                for (var key in ticket_data) {
                    update_ticket(ticket_data[key].data[i], i, key);
                }
                if (i > 0) {
                    for (var key in gps_data) {
                        if (ticket_data[key].data[i]['route_direction'] == 'UP') {
                            dist_travelled[key] += (google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(gps_data[key].data[i]['LAT'], gps_data[key].data[i]['LONGITUDE']), new google.maps.LatLng(gps_data[key].data[i - 1]['LAT'], gps_data[key].data[i - 1]['LONGITUDE'])) / 1000);
                        } else {
                            dist_travelled[key] -= (google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(gps_data[key].data[i]['LAT'], gps_data[key].data[i]['LONGITUDE']), new google.maps.LatLng(gps_data[key].data[i - 1]['LAT'], gps_data[key].data[i - 1]['LONGITUDE'])) / 1000);
                        }
                    }
                    if (i % 1000 == 0) {
                        addData({ 'label': i.toString(), 'vals': Object.values(dist_travelled) });
                    } else {
                        addData({ 'label': '', 'vals': Object.values(dist_travelled) });
                    }
                    myNewChart.update();
                }
                i++;
                window.setTimeout(internalCallback, 1000 / timeFactor);

            }
        }
    }(3000);
    window.setTimeout(internalCallback, 0);
}

function changeData(data_vals, key, data) {
    /*
    Converts data from promise to actual data
    */
    data_vals[key] = data;
}

async function initMap() {
    /*
    Main function called from html page
    */
    var bangalore = new google.maps.LatLng(12.9716, 77.5946);
    var mapProp = {
        center: bangalore,
        zoom: 12
    };
    var path = [];
    var bounds = new google.maps.LatLngBounds();
    var promise_map = await new Promise(function(resolve, reject) {
        map = new google.maps.Map(document.getElementById("map"), mapProp);
        resolve(map);
    });

    var find_route = await getData('http://localhost:8000/new_data/248_up_reduced.csv')
        .then(function(data) {
            /* for (var i = 0; i < data.data.length; i++) {
                path.push(new google.maps.LatLng(data.data[i]['LAT'], data.data[i]['LONGITUDE']));
                bounds.extend(new google.maps.LatLng(data.data[i]['LAT'], data.data[i]['LONGITUDE'])); */
            var directionsDisplay = new google.maps.DirectionsRenderer({ suppressMarkers: true });
            var directionsService = new google.maps.DirectionsService();
            var waypts = []
            var org = new google.maps.LatLng(12.9609, 77.5746);
            var dest = new google.maps.LatLng(13.038451, 77.518273);
            for (var i = 1; i < data.data.length - 1; i++) {
                waypts.push({ location: new google.maps.LatLng(data.data[i]['LAT'], data.data[i]['LONGITUDE']) });
            }
            var request = {
                origin: org,
                destination: dest,
                waypoints: waypts,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };
            directionsService.route(request, function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                    directionsDisplay.setMap(map);
                } else {
                    alert("Directions Request from " + start.toUrlValue(6) + " to " + end.toUrlValue(6) + " failed: " + status);
                }

            })
        });

    var promise_ticket = await getFileNames("http://localhost:8000/new_data/ticket_bin_data")
        .then(function(data) {
            return Object.entries(data);
        })
        .then(function(data) {
            //console.log(data);
            return data.reduce(function(sequence, [key, value]) {
                //console.log(key, value);
                return sequence
                    .then(function() {
                        return [key, getData(value)];
                    })
                    .then(function(data) {
                        ticket_data[data[0]] = data[1];
                    });
            }, Promise.resolve());
        })
        .then(function() {
            return Promise.all(Object.values(ticket_data))
        })
        .then(function(arrayObjects) {
            keys = Object.keys(ticket_data);
            for (var i = 0; i < keys.length; i++) {
                changeData(ticket_data, keys[i], arrayObjects[i])
            }
        });

    var promise_gps = await getFileNames("http://localhost:8000/new_data/gps_bin_data")
        .then(function(data) {
            return Object.entries(data);
        })
        .then(function(data) {
            return data.reduce(function(sequence, [key, value]) {
                return sequence
                    .then(function() {
                        return [key, getData(value)];
                    })
                    .then(function(data) {
                        gps_data[data[0]] = data[1];
                    });
            }, Promise.resolve());
        })
        .then(function(data) {
            return Promise.all(Object.values(gps_data))
        })
        .then(function(arrayObjects) {
            keys = Object.keys(gps_data);
            for (var i = 0; i < keys.length; i++) {
                changeData(gps_data, keys[i], arrayObjects[i])
            }
        });



    $(function() {
        Promise.all([promise_map, promise_gps, promise_ticket]).then(function(arg) {
            iterate(arg[0], gps_data, ticket_data);
        });
    })
}