var PORT = 3507;

var express = require('express');
var app = express();
var request = require('request');
var id = require('./id');
var querystring = require('querystring');
var notifier = require('./notifier');

var currentToken = "";
function authorize(callback) {
   request({
        url: 'https://accounts.spotify.com/api/token',
        method: "POST",
        body: "grant_type=client_credentials",
        headers : { "Authorization": "Basic " + id.id,
        'Content-Type': 'application/x-www-form-urlencoded'
        }
    },
      function(error, response, body) {
        var token = JSON.parse(body).access_token;
        currentToken = token;
      }
    );
}
function getPlaylist(user, playlistID, callback, callbackparams) {
    var ret = "";
    request({
        url: "https://api.spotify.com/v1/users/" + 
            user + "/playlists/" + 
            playlistID + "?fields=tracks.items(track(name, id ))",
        method: "GET",
        headers: { 
            "Authorization" : "Bearer " + currentToken,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
   
    }, function(error, response, body) {
        callback(body, callbackparams);
    });
}




app.get('/spotify', function(req, res) {
    var html = "<html><body>";
    html += "<p>you can get your spotify URI by going to the<br> playlist you want, right clicking <br>it (or clicking the 3 dots), going to Share,<br> and clicking 'copy spotify URI'.<br> Paste that into the web page.</p><br>";
    html += "<form action='/spotify' method='POST'>";
    html += "uri1: <input type='text' name='uri1'><br>";
    html += "uri2: <input type='text' name='uri2'><br>";
    html += "<input type='submit' value='submit'>";
    html += "</form></body></html>";
    authorize();
    notifier.postToGroup("Page accessed!");
    res.send(html);
});

function getMatches(list1, list2, callback) {
    getPlaylist(list1.user, list1.playlist,
        function(list1Body) {
            getPlaylist(list2.user, list2.playlist,
                function(list2Body) {
                    processLists(list1Body, list2Body,
                        callback
                    );
                }
            );
        }
    );
}

var Match = function(name, id, rank1, rank2) {
    this.name = name;
    this.id = id;
    this.rank1 = rank1;
    this.rank2 = rank2;
}
function processLists(list1Body, list2Body, callback) {
    list1Body = JSON.parse(list1Body);
    list2Body = JSON.parse(list2Body);
    tracks1 = list1Body.tracks.items;
    tracks2 = list2Body.tracks.items;
    
    var matches = [];

    for (var i = tracks1.length - 1; i>=0; i--) {
        for (var k = tracks2.length - 1; k>=0; k--) {
            var track1 = tracks1[i].track;
            var track2 = tracks2[k].track;

            if (track1.id == track2.id) {
                var match = new Match(
                    track1.name,
                    track1.id,
                    i+1,
                    k+1
                );
                matches.push(match);

                //tracks1.splice(i, 1);
                //tracks2.splice(k, 1);
            }
        }
    }
    var tableHTML = "<table><tr>";
    tableHTML += "<th>Name</th><th>Rank #1</th><th>Rank #2</th>";
    tableHTML += "</tr>";
    for (var i = 0; i<matches.length; i++){
        tableHTML += "<tr>";
        tableHTML += "<td>" + matches[i].name + "</td>";
        tableHTML += "<td>" + matches[i].rank1 + "</td>";
        tableHTML += "<td>" + matches[i].rank2 + "</td>";
        tableHTML += "</tr>";
    }
    tableHTML += "</table>";
    tableHTML += "<br>Number of repeats: " + matches.length;
    
    callback(tableHTML);
}
app.post('/spotify', function(req, res) {
    notifier.postToGroup("Info sent");
    var string = "";
    req.on('data', function(data) {
        string += data;
    });

    req.on('end', function(){
        var error = false;
//        var data = JSON.parse(string);
        var data = querystring.parse(string); 
        if (!data) error = true;


        var uri1arr = data.uri1.split(":");
        var uri2arr = data.uri2.split(":");

        if (uri1arr.length != 5 || uri2arr.length!=5) error = true;
        if (error) {
            res.send("Input error, please try again");
            return;
        }
        var u1 = uri1arr[2];
        var p1 = uri1arr[4];
        var u2 = uri2arr[2];
        var p2 = uri2arr[4];

        getMatches(
            {
                "user" : u1, 
                "playlist" : p1 
            },
            {
                "user" : u2, 
                "playlist" : p2
            },           
            function(data) {
                res.send(data);
            }
        );
    });

});



app.listen(PORT, function() {
    console.log('listening on ' + PORT);
});

