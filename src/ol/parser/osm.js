goog.require('goog.dom.xml');
goog.require('ol.Feature');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Point');
goog.require('ol.parser.XML');
goog.provide('ol.parser.OSM');



/**
 * @constructor
 * @extends {ol.parser.XML}
 */
ol.parser.OSM = function() {

  this.defaultNamespaceURI = 'http://openstreetmap.org/';

  this.readers = {
    'http://openstreetmap.org/': {
      'osm': function(node, object) {
        if (!goog.isDef(object.features)) {
          object.features = [];
        }
        this.readChildNodes(node, object);
      },
      'node': function(node, object) {
        var container = {properties: {}};
        var id = node.getAttribute('id');
        var lat = parseFloat(node.getAttribute('lat'));
        var lon = parseFloat(node.getAttribute('lon'));

        // save feature properties to attributes
        container.properties = {
          version: node.getAttribute('version'),
          timestamp: node.getAttribute('timestamp'),
          changeset: node.getAttribute('changeset'),
          uid: node.getAttribute('uid'),
          user: node.getAttribute('user')
        };

        this.readChildNodes(node, container.properties);

        var feature = new ol.Feature(container.properties);

        // shared vertices are used
        var sharedVertices;
        if (this.readFeaturesOptions_) {
          var callback = this.readFeaturesOptions_.callback;
          if (callback) {
            sharedVertices = callback(feature,
                ol.geom.GeometryType.POINT);
          }
        }

        // set feature attributes
        var geometry = new ol.geom.Point([lon, lat], sharedVertices);
        feature.setGeometry(geometry);

        // set feature ID
        feature.setId(id);

        // push feature to features array
        object.features.push(feature);
      },
      'tag': function(node, object) {
        object[node.getAttribute('k')] = node.getAttribute('v');
      }
    }
  };

  goog.base(this);
};
goog.inherits(ol.parser.OSM, ol.parser.XML);


/**
 * @param {string|Document|Element|Object} data to read
 * @param {Function=} opt_callback Optional callback to call when reading is
 * done.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.OSM.prototype.read = function(data, opt_callback) {
  if (goog.isString(data)) {
    data = goog.dom.xml.loadXml(data);
  }
  if (data && data.nodeType == 9) {
    data = data.documentElement;
  }
  var obj = {};
  obj.metadata = {projection: 'EPSG:4326'};
  this.readNode(data, obj);
  if (obj.features === undefined) {
      obj.features = null;
  }
  if (goog.isDef(opt_callback)) {
    opt_callback.call(null, obj);
  }
  return obj;
};


/**
 * Parse a XAPI document provided as a string.
 * @param {string} str XAPI document.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.OSM.prototype.readFeaturesFromString =
    function(str, opt_options) {
  this.readFeaturesOptions_ = opt_options;
  return this.read(str);
};

/**
 * @param {string} str String data.
 * @param {function(ol.parser.ReadFeaturesResult)}
 *     callback Callback which is called after parsing.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Feature reading options.
 */
ol.parser.OSM.prototype.readFeaturesFromStringAsync =
    function(str, callback, opt_options) {
  this.readFeaturesOptions_ = opt_options;
  this.read(str, callback);
};
