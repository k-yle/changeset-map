import adiffParser from '@osmcha/osm-adiff-parser';
import jsonParser from 'real-changesets-parser';
import { query } from './query';
import { config } from './config';

export function getChangeset(changesetID, options) {
  return query(changesetID, options).then(data => {
    const [changeset, options] = data;
    if (options.enableRealChangesets) {
      const url = `${config.S3_URL}${changesetID}.json`;
      return fetch(url)
        .then(r => {
          if (r.ok) return r.json();
          // Fallback to overpass
          return Promise.reject();
        })
        .then(r => {
          if (r.elements.length === 0) return Promise.reject();
          const geojson = jsonParser(r);
          const featureMap = getFeatureMap(geojson);
          const ret = {
            geojson: geojson,
            featureMap: featureMap,
            changeset: changeset
          };
          return ret;
        })
        .catch(() =>
          fetchFromOverPass(changesetID, changeset, options.overpassBase)
        );
    } else {
      return fetchFromOverPass(changesetID, changeset, options.overpassBase);
    }
  });
}

function fetchFromOverPass(changesetID, changeset, overpassBase) {
  var data = getDataParam(changeset);
  var bbox = getBboxParam(changeset.bbox);
  var url = overpassBase + '?data=' + data + '&bbox=' + bbox;

  return fetch(url, {
    'Response-Type': 'application/osm3s+xml'
  })
    .then(r => r.text())
    .then(xml => adiffParser(xml))
    .catch(err =>
      Promise.reject({
        msg: 'Failed to parser adiff xml.',
        error: err
      })
    )
    .then(json => {
      var elements = Object.keys(json).reduce(
        (result, item) => result.concat(json[item]),
        []
      );
      var geojson = jsonParser({
        elements: elements
      });
      var featureMap = getFeatureMap(geojson);

      return {
        geojson: geojson,
        featureMap: featureMap,
        changeset: changeset
      };
    })
    .catch(err =>
      Promise.reject({
        msg: 'Overpass query failed.',
        error: err
      })
    );
}

function getDataParam(c) {
  return (
    '[out:xml][adiff:%22' +
    c.from.toString() +
    ',%22,%22' +
    c.to.toString() +
    '%22];(node(bbox)(changed);way(bbox)(changed);relation(bbox)(changed););out%20meta%20geom(bbox);'
  );
}

function getBboxParam(bbox) {
  return [bbox.left, bbox.bottom, bbox.right, bbox.top].join(',');
}

function getFeatureMap(geojson) {
  var features = geojson.features;
  var featureMap = {};

  for (var i = 0, len = features.length; i < len; i++) {
    var id = features[i].properties.id;
    featureMap[id] = featureMap[id] || [];
    featureMap[id].push(features[i]);
  }

  return featureMap;
}
