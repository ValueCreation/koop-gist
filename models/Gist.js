var Geohub = require('geohub')

function Gist (koop) {
  if (!koop.config.ghtoken) {
    console.warn('No Github Token in config. This may cause problems accessing data.')
  }

  var gist = {}

  gist.prototype = koop.BaseModel(koop)

  gist.find = function find (id, options, callback) {
    var type = 'Gist'

    // looks for data in the cache first
    koop.Cache.get(type, id, options, function (err, entry) {
      if (err) {
        Geohub.gist({ id: id, token: koop.config.ghtoken }, function (err, geojson) {
          if (err) return callback(err, null)

          if (!geojson.length) geojson = [geojson]

          var _totalLayer = geojson.length
          var finalJson = []

          // local method to collect layers and send them all
          var _send = function (data) {
            finalJson.push(data)

            if (finalJson.length === _totalLayer) {
              return callback(null, finalJson)
            }
          }

          geojson.forEach(function (layer, i) {
            koop.Cache.insert(type, id, layer, i, function (err, success) {
              if (err) return callback(err)
              if (success) return _send(layer)
            })
          })
        })
      } else {
        callback(null, entry)
      }
    })
  }

  // compares the updated_at timestamp on the cached data and the hosted data
  // this method name is special reserved name that will get called by the cache model
  gist.checkCache = function checkCache (id, data, options, callback) {
    Geohub.gistSha(id, koop.config.ghtoken, function (err, sha) {
      if (err) return callback(err)
      if (sha === data[0].updated_at) return callback(null, false)

      Geohub.gist({ id: id, token: koop.config.ghtoken }, function (err, geojson) {
        if (err) return callback(err)
        callback(null, geojson)
      })
    })
  }

  return gist
}

module.exports = Gist
