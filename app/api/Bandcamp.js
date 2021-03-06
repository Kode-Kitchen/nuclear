const bandcamp = require('bandcamp-scraper');
const request = require('request');
const youtube = require('./Youtube');

function bandcampDurationToStr(duration) {

  var hours = duration.split('P')[1].split('H')[0];
  var minutes = duration.split('H')[1].split('M')[0];
  var seconds = duration.split('M')[1].split('S')[0];

  if(hours === '00') {
    return minutes + ':' + seconds;
  } else {
    return hours + ':' + minutes + ':' + seconds;
  }
}

function getTrackStream(url, callback) {
  var trackRegex = /{"mp3-128":"(.+?)"/ig;

  request(url, (err, response, body) => {
    if(err) {
      console.error('Could not retrieve stream URL for track: ' + url);
    } else {
      var result = trackRegex.exec(body);

      if (result !== null) {
        callback('http:' + result[1]);
      } else {
        console.error('Could not retrieve stream URL for track: ' + url);
      }
    }
  });
}

function getAlbumTracks(album, callback) {
  var albumTracks = [];
  bandcamp.getAlbumInfo(album.data.id, (error, albumInfo) => {
    if (error) {
      callback(error, null);
      return;
    }

    albumInfo.tracks.map((el, i) => {
      var newItem = {
        source: 'bandcamp track',
        data: {
          id: el.url,
          thumbnail: album.data.thumbnail,
          artist: albumInfo.artist,
          title: albumInfo.artist + ' - ' + el.name,
          length: bandcampDurationToStr(el.duration),
          streamUrl: el.url,
          streamUrlLoading: false,
          streamLength: null
        }
      };

      albumTracks.push(newItem);
    });

    callback(null, albumTracks);
  });
}

function bandcampSearch(terms, searchResults, songListChangeCallback) {
  var tempResults = [];
  var added = 0;

  for (var i=1; i<6; i++) {
    bandcamp.search({query: terms, page: i}, (error, results) => {
        tempResults = tempResults.concat(results);
        if(added++ >= 4) {
          tempResults = tempResults.filter((el) => {return (el.type==='track')||(el.type==='album')});
          tempResults.map((el, i) => {
            var newItem = {
              source: el.type==='album' ? 'bandcamp album' : 'bandcamp track',
              data: {
                id: el.url,
                thumbnail: el.imageUrl,
                artist: el.artist,
                title: el.artist + ' - ' + el.name,
                length: el.numTracks != undefined ? el.numTracks : 'Unknown',
                streamUrl: el.url,
                streamUrlLoading: false,
                streamLength: null
              }
            };

            searchResults.push(newItem);
          });

          this.songListChangeCallback(searchResults);
          this.setState({songList: searchResults});
        }
    });
  }
}

module.exports = {
  bandcampSearch: bandcampSearch,
  getTrackStream: getTrackStream,
  getAlbumTracks: getAlbumTracks
}
