//var colale={};
Number.prototype.pad = function (size) {
	var s = String(this);
	while (s.length < (size || 2)) {
		s = "0" + s;
	}
	return s;
}

colale.lib = (function () {
	console.log("init colale.lib");
	/* from http://javascript.crockford.com/remedial.html [09.08.2014] */
	function typeOf(value) {
		var s = typeof value;
		if (s === 'object') {
			if (value) {
				if (Object.prototype.toString.call(value) == '[object Array]') {
					s = 'array';
				}
			} else {
				s = 'null';
			}
		}
		return s;
	}

	/*
	 * @param object object or array
	 * @return if object is array: object.
	 *         otherwise [object].
	 */
	function makeArray(object) {
		if (typeOf(object) == 'array') {
			return object;
		}
		return [object];
	}

	/*
	 * xml2json und text2xml entnommen aus: jquery.xml2json.js
	 */
	// converts xml documents and xml text to json object
	function xml2json(xml, extended) {
		if (!xml)
			return {}; // quick fail

		//### PARSER LIBRARY
		// Core function
		function parseXML(node, simple) {
			if (!node)
				return null;
			var txt = '',
			obj = null,
			att = null;
			var nt = node.nodeType,
			nn = jsVar(node.localName || node.nodeName);
			var nv = node.text || node.nodeValue || '';
			/*DBG*///if(window.console) console.log(['x2j',nn,nt,nv.length+' bytes']);
			if (node.childNodes) {
				if (node.childNodes.length > 0) {
					/*DBG*///if(window.console) console.log(['x2j',nn,'CHILDREN',node.childNodes]);
					$.each(node.childNodes, function (n, cn) {
						var cnt = cn.nodeType,
						cnn = jsVar(cn.localName || cn.nodeName);
						var cnv = cn.text || cn.nodeValue || '';
						/*DBG*///if(window.console) console.log(['x2j',nn,'node>a',cnn,cnt,cnv]);
						if (cnt == 8) {
							/*DBG*///if(window.console) console.log(['x2j',nn,'node>b',cnn,'COMMENT (ignore)']);
							return; // ignore comment node
						} else if (cnt == 3 || cnt == 4 || !cnn) {
							// ignore white-space in between tags
							if (cnv.match(/^\s+$/)) {
								/*DBG*///if(window.console) console.log(['x2j',nn,'node>c',cnn,'WHITE-SPACE (ignore)']);
								return;
							};
							/*DBG*///if(window.console) console.log(['x2j',nn,'node>d',cnn,'TEXT']);
							txt += cnv.replace(/^\s+/, '').replace(/\s+$/, '');
							// make sure we ditch trailing spaces from markup
						} else {
							/*DBG*///if(window.console) console.log(['x2j',nn,'node>e',cnn,'OBJECT']);
							obj = obj || {};
							if (obj[cnn]) {
								/*DBG*///if(window.console) console.log(['x2j',nn,'node>f',cnn,'ARRAY']);

								// http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
								if (!obj[cnn].length)
									obj[cnn] = myArr(obj[cnn]);
								obj[cnn] = myArr(obj[cnn]);

								obj[cnn][obj[cnn].length] = parseXML(cn, true /* simple */
									);
								obj[cnn].length = obj[cnn].length;
							} else {
								/*DBG*///if(window.console) console.log(['x2j',nn,'node>g',cnn,'dig deeper...']);
								obj[cnn] = parseXML(cn);
							};
						};
					});
				}; //node.childNodes.length>0
			}; //node.childNodes
			if (node.attributes) {
				if (node.attributes.length > 0) {
					/*DBG*///if(window.console) console.log(['x2j',nn,'ATTRIBUTES',node.attributes])
					att = {};
					obj = obj || {};
					$.each(node.attributes, function (a, at) {
						var atn = jsVar(at.name),
						atv = at.value;
						att[atn] = atv;
						if (obj[atn]) {
							/*DBG*///if(window.console) console.log(['x2j',nn,'attr>',atn,'ARRAY']);

							// http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
							//if(!obj[atn].length) obj[atn] = myArr(obj[atn]);//[ obj[ atn ] ];
							obj[cnn] = myArr(obj[cnn]);

							obj[atn][obj[atn].length] = atv;
							obj[atn].length = obj[atn].length;
						} else {
							/*DBG*///if(window.console) console.log(['x2j',nn,'attr>',atn,'TEXT']);
							obj[atn] = atv;
						};
					});
					//obj['attributes'] = att;
				}; //node.attributes.length>0
			}; //node.attributes
			if (obj) {
				obj = $.extend((txt != '' ? new String(txt) : {}), /* {text:txt},*/
						obj || {}

						/*, att || {}*/
					);
				//txt = (obj.text) ? (typeof(obj.text)=='object' ? obj.text : [obj.text || '']).concat([txt]) : txt;
				txt = (obj.text) ? ([obj.text || '']).concat([txt]) : txt;
				if (txt)
					obj.text = txt;
				txt = '';
			};
			var out = obj || txt;
			//console.log([extended, simple, out]);
			if (extended) {
				if (txt)
					out = {}; //new String(out);
				txt = out.text || txt || '';
				if (txt)
					out.text = txt;
				if (!simple)
					out = myArr(out);
			};
			return out;
		}; // parseXML
		// Core Function End
		// Utility functions
		var jsVar = function (s) {
			return String(s || '').replace(/-/g, "_");
		};

		// NEW isNum function: 01/09/2010
		// Thanks to Emile Grau, GigaTecnologies S.L., www.gigatransfer.com, www.mygigamail.com
		function isNum(s) {
			// based on utility function isNum from xml2json plugin (http://www.fyneworks.com/ - diego@fyneworks.com)
			// few bugs corrected from original function :
			// - syntax error : regexp.test(string) instead of string.test(reg)
			// - regexp modified to accept  comma as decimal mark (latin syntax : 25,24 )
			// - regexp modified to reject if no number before decimal mark  : ".7" is not accepted
			// - string is "trimmed", allowing to accept space at the beginning and end of string
			var regexp = /^((-)?([0-9]+)(([\.\,]{0,1})([0-9]+))?$)/
				return (typeof s == "number") || regexp.test(String((s && typeof s == "string") ? jQuery.trim(s) : ''));
		};
		// OLD isNum function: (for reference only)
		//var isNum = function(s){ return (typeof s == "number") || String((s && typeof s == "string") ? s : '').test(/^((-)?([0-9]*)((\.{0,1})([0-9]+))?$)/); };

		var myArr = function (o) {

			// http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
			//if(!o.length) o = [ o ]; o.length=o.length;
			if (!$.isArray(o))
				o = [o];
			o.length = o.length;

			// here is where you can attach additional functionality, such as searching and sorting...
			return o;
		};
		// Utility functions End
		//### PARSER LIBRARY END

		// Convert plain text to xml
		if (typeof xml == 'string')
			xml = text2xml(xml);

		// Quick fail if not xml (or if this is a node)
		if (!xml.nodeType)
			return;
		if (xml.nodeType == 3 || xml.nodeType == 4)
			return xml.nodeValue;

		// Find xml root node
		var root = (xml.nodeType == 9) ? xml.documentElement : xml;

		// Convert xml to json
		var out = parseXML(root, true /* simple */
			);

		// Clean-up memory
		xml = null;
		root = null;

		// Send output
		return out;
	}

	// Convert text to XML DOM
	function text2xml(str) {
		// NOTE: I'd like to use jQuery for this, but jQuery makes all tags uppercase
		//return $(xml)[0];

		/* prior to jquery 1.9 */
		/*
		var out;
		try{
		var xml = ((!$.support.opacity && !$.support.style))?new ActiveXObject("Microsoft.XMLDOM"):new DOMParser();
		xml.async = false;
		}catch(e){ throw new Error("XML Parser could not be instantiated") };
		try{
		if((!$.support.opacity && !$.support.style)) out = (xml.loadXML(str))?xml:false;
		else out = xml.parseFromString(str, "text/xml");
		}catch(e){ throw new Error("Error parsing XML string") };
		return out;
		 */

		/* jquery 1.9+ */
		return $.parseXML(str);
	}

	function excelXML2Table(xml) {
		var failed = {
			in_function : "excelXML2Table"
		};
		if (xml == undefined || xml == null) {
			throw "Illegal Argument: xml undefined or null";
		}

		var xmlAsJson = xml2json(xml);

		if (xmlAsJson == undefined || xmlAsJson == null
			 || xmlAsJson.Worksheet == undefined || xmlAsJson.Worksheet == null
			 || xmlAsJson.Worksheet.Table == undefined || xmlAsJson.Worksheet.Table == null
			 || xmlAsJson.Worksheet.Table.Row == undefined || xmlAsJson.Worksheet.Table.Row == null) {
			throw "Illegal Argument: xml is not in Excel 2004 XML format.";
		}

		var excelTable = xmlAsJson.Worksheet.Table;
		var resultTable = [];

		for (var row_ctr = 0; row_ctr < excelTable.Row.length; row_ctr++) {
			var cells = excelTable.Row[row_ctr].Cell;
			var cellIndex = 0;
			var resultRow = [];
			for (var cell_ctr = 0; cell_ctr < cells.length; cell_ctr++) {
				var cell = cells[cell_ctr];
				if (!(cell == undefined) && !(cell["ss:Index"] == undefined)) {
					for (var j = cellIndex; j < cell["ss:Index"] - 1; j++) {
						resultRow[j] = "";
					}
					cellIndex = cell["ss:Index"] - 1;
				}
				function getCellData(cell) {
					if (cell == undefined) {
						return "";
					}
					if (cell.Data == undefined) {
						return "";
					}
					var cellData = cell.Data;
					// In Excel-Zellen koennen Font-Elemente enthalten sein.
					// In diesem Fall ist der Text nicht direkt in cell.Data,
					// sondern in den Kindknoten der Font-Elemente enthalten.
					// Der Text muss also aus den Text-Kindknoten der Font-Elemente
					// entnommen werden.
					if (cellData.Font == undefined) {
						return cellData;
					}
					//				console.log("cellData contains font nodes: "+JSON.stringify(cellData));
					// xml2json erzeugt ein Font-Objekt, wenn es einen Font-Knoten gibt
					// und ein Font-Array, wenn es mehrere Font-Knoten gibt.
					// -> vereinheitlichen fuer Weiterverarbeitung: Font-Array
					var fontNodes = makeArray(cellData.Font);
					var cellString = "";
					for (var i = 0; i < fontNodes.length; i++) {
						//				console.log("i: "+i);
						// alle Font-Kindknoten bzw. deren Text-Kindknoten uebernehmen
						var childNode = fontNodes[i];
						var text;
						if (childNode.text == undefined) {
							text = childNode;
						} else {
							text = childNode.text;
						}
						//					console.log(
						//						"fontNodes["+i+"]: "+
						//						JSON.stringify(childNode)+
						//						" text: "+text
						//					);
						if (!(text == "[object Object]")) {
							cellString += text;
							if (i < fontNodes.length - 1) {
								cellString += " ";
							}
						}
					}
					//				console.log("trimmed cellData: "+cellString);

					return cellString;
				}
				resultRow[cellIndex] = getCellData(cell);
				cellIndex++;
			}
			resultTable[row_ctr] = resultRow;
		}
		return resultTable;
	}

	/*
	 * Returns map m with:
	 * 	- entries in column with header headerKey -> map key
	 *  - entries in columns with headers headers -> map value
	 * @pre headerKey in headers
	 */
	function table2DictEntries(table, headers, headerKey) {
		console.log(
			"table2DictEntries(<table>, " +
			JSON.stringify(headers) + ", " +
			JSON.stringify(headerKey) + ")");
		var failed = undefined;
		if (table == undefined || table == null) {
			throw "Illegal Argument: table is undefined or null.";
		}
		if (headers == undefined || headers == null) {
			throw "Illegal Argument: headers is undefined or null.";
		}
		if (headerKey == undefined ||
			headerKey == null ||
			!(headers[headerKey])) {
			throw "Illegal Argument: headerKey is invalid";
		}

		var header = table[0];
		if (header == undefined || header == null) {
			return failed;
		}
		var headerMap = {};
		for (var i = 0; i < header.length; i++) {
			var headerEntry = header[i];
			if (!(headers[headerEntry] == undefined)) {
				headerMap[header[i]] = i;
			}
		}
		var maxIndex = -1;
		for (var propt in headers) {
			if (headerMap[propt] == undefined) {
				return {
					result : {},
					errors : ["Missing table header: '" + propt + "'."]
				};
			}
			if (headerMap[propt] > maxIndex) {
				maxIndex = headerMap[propt];
			}
		}

		var resultEntries = {};
		var errors = [];

		for (var row_ctr = 1; row_ctr < table.length; row_ctr++) {
			var row = table[row_ctr];
			if (row.length < maxIndex + 1) {
				errors[errors.length] =
					"Row #" + row_ctr +
					" does not contain enough cells (" +
					row.length + " cells instead of " +
					(maxIndex + 1) + " cells.";
				continue;
			}
			var entry = {};
			for (var propt in headers) {
				entry[propt] = row[headerMap[propt]];
			}
			key = entry[headerKey];
			resultEntries[key] = resultEntries[key] || [];
			resultEntryArray = resultEntries[key];
			resultEntryArray[resultEntryArray.length] = entry;
		}
		return {
			result : resultEntries,
			"errors" : errors
		};
	}

	function isInvalid(obj) {
		return obj == undefined || obj == null;
	}

	/* taken from http://stackoverflow.com/questions/365826/calculate-distance-between-2-gps-coordinates
	(01.08.2014) */
	Number.prototype.toRad = function () {
		return this * (Math.PI / 180);
	};
	Number.prototype.fromRad = function () {
		return (this / Math.PI) * 180;
	};

	/* @return Distance between (lat1,lon1) and (lat2,lon2) in meters.
	 */
	function gps_dist(lat1, lon1, lat2, lon2) {
		var R = 6371000; // approx. radius of earth in m
		var dLat = (lat2 - lat1).toRad();
		var dLon = (lon2 - lon1).toRad();
		var lat1 = lat1.toRad();
		var lat2 = lat2.toRad();

		var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2)
			 * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		var d = R * c;

		return d;
	}

	/*
	 * Calculate new latitude and longitude starting vom (lat,lon)
	 * going dist m with a bearing of bearing.
	 * @lat latitude of starting point (degrees N)
	 * @lon longitude of starting point (degrees E)
	 * @bearing bearing (degrees, clockwise, N=0)
	 * @dist distance in meters
	 * @return {lat: new latitude, lon: new longitude}
	 * @source http://www.movable-type.co.uk/scripts/latlong.html [14.08.2014]
	 */
	function bearing_and_dist_to_gps(lat, lon, bearing, dist) {
		var R = 6371000; // approx. radius of earth in m
		lat = lat.toRad();
		lon = lon.toRad();
		var lat2 = Math.asin(
				Math.sin(lat) * Math.cos(dist / R) +
				Math.cos(lat) * Math.sin(dist / R) * Math.cos(bearing));
		var lon2 = lon
			+Math.atan2(
				Math.sin(bearing) * Math.sin(dist / R) * Math.cos(lat),
				Math.cos(dist / R) - Math.sin(lat) * Math.sin(lat2));
		lat = lat.fromRad();
		lon = lon.fromRad();
		lat2 = lat2.fromRad();
		lon2 = lon2.fromRad();
		console.log("(lat,lon): (" + lat + "," + lon + ") / bearing: " + bearing + " / dist: " + dist);
		console.log("(lat2,lon2): (" + lat2 + "," + lon2 + ")");
		return {
			"lat" : lat2,
			"lon" : lon2
		};
	}

	var fromBrowser = !(document.URL.match(/^https?:/) == null);
	console.log("fromBrowser: " + fromBrowser);

	var fromFile = !(document.URL.match(/^file:/) == null);
	console.log("fromFile: " + fromFile);

	//OOSO: Update according to threashold
	//onSuccess Callback
	//This method accepts a `Position` object, which contains
	//the current GPS coordinates
	//
	function onSuccessLocationUpdate(position) {
		//var element = document.getElementById('geolocation');
		//element.innerHTML = 'Latitude: '  + position.coords.latitude      + '<br />' +
		console.log('Latitude : ' + position.coords.latitude + ', ' +
			'Longitude: ' + position.coords.longitude);
	}

	//onError Callback receives a PositionError object
	//
	function onErrorLocationUpdate(error) {
		alert('code: ' + error.code + '\n' +
			'message: ' + error.message + '\n');
	}
		
	return {
		"typeOf" : typeOf,
		"makeArray" : makeArray,
		"excelXML2Table" : excelXML2Table,
		"table2DictEntries" : table2DictEntries,
		"xml2json" : xml2json,
		"isInvalid" : isInvalid,
		"hash_symbol" : "%23",
		"gps_dist" : gps_dist,
		"bearing_and_dist_to_gps" : bearing_and_dist_to_gps,
		"fromBrowser" : fromBrowser,
		"fromFile" : fromFile,

		// OOSO
		"onErrorLocationUpdate" : onErrorLocationUpdate,
		"onSuccessLocationUpdate" : onSuccessLocationUpdate,
	}
})();