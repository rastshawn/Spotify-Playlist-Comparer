var PORT = 3507;

var express = require('express');
var app = express();
var request = require('request');
var id = require('./id');
console.log(id.id);
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
        callback(token);
      }
    );
}
function getPlaylist(user, playlistID, key) {
    request({
        url: "https://api.spotify.com/v1/users/" + 
            user + "/playlists/" + 
            playlistID + "?fields=tracks.items(track(name, id ))",
        method: "GET",
        //json: true,
        headers: { 
            "Authorization" : "Bearer " + key,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
   
    }, function(error, response, body) {
        console.log(body);
    });
}



app.get('/spotify', function(req, res) {
    console.log(req);
    console.log("get");
    res.send("<html><body>HELLOWORLD</body></html>");
});


app.post('/spotify', function(req, res) {
    var string = "";
    req.on('data', function(data) {
        string += data;
    });

    req.on('end', function(){
        var data = JSON.parse(string);

             

    });

});



app.listen(PORT, function() {
    console.log('listening on ' + PORT);
});

*/
