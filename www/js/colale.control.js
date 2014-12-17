colale.control = (function () {
	console.log("init colale.control");

	var lib = colale.lib;
	var model = colale.model;
	var view = colale.view;
	var constants = colale.constants;

	function showError(msg) {
		alert(msg);
	}
	function showMessage(msg) {
		alert(msg);
	}

	function init(success, error) {
		constants.init(success, error);
		model.init(// success
			function () {
			view.init(success, error);
		}, // success
			error // error
		);
	}

	function showFlashcard(category, index, return_to_page_id) {
		flurryTracker("showFlashcard -> " + category + " : " + index );
		
		model.setCurrentFlashCard(category, index);
		view.flashcard.init(return_to_page_id);
		view.flashcard.show(category, index);
		var flashcard_page = $("#colale_flashcard");
		$.mobile.changePage(flashcard_page);
	}

	function showCategory(category, return_to_page_id) {
		if (lib.isInvalid(category)) {
			throw "COLALE.control.showCategory: Illegal Argument category: '" + category + "'.";
		}
		var flashCards = model.getFlashCards()[category];
		if (lib.isInvalid(flashCards) || lib.isInvalid(flashCards[0])) {
			showError(
				"Es gibt keine Lernkarte zur Kategorie '" + category + "'.");
			return;
		};
		showFlashcard(category, 0, return_to_page_id);
	}
	
	function showFlashcardList(category) {
		if (lib.isInvalid(category)) {
			throw "COLALE.control.showCategory: Illegal Argument category: '" + category + "'.";
		}
		/*
		var flashCards = model.getFlashCards()[category];
		if (lib.isInvalid(flashCards) || lib.isInvalid(flashCards[0])) {
			showError(
				"Es gibt keine Lernkarte zur Kategorie '" + category + "'.");
			return;
		};
		*/
		flurryTracker("showCategoryList -> " + category);
		
		model.setCurrentCategory(category);
		view.flashcardsList.init(category);
		/*
		view.flashcard.init(0);
		view.flashcard.show(category, 0);

		view.flashcardList(category, 0, return_to_page_id);
		*/
		var flashcard_page = $("#colale_select_flashcards_list");
		$.mobile.changePage(flashcard_page);
		
	}

	function showPOI(category) {
		var curPage = $.mobile.activePage;
		var return_to_page_id = "#" + curPage.attr("id");
		//	console.log("return_to_page_id: "+return_to_page_id);

		var flashCards = model.getFlashCards();
		if (!(flashCards[category] == undefined)) {
			showCategory(category, return_to_page_id);
		}
	}

	function showNextFlashcard() {
		var currentFlashCard = model.getCurrentFlashCard();
		var category = currentFlashCard.category;
		var index = currentFlashCard.index;
		var flashCards = model.getFlashCards()[category];
		index = (index + 1) % flashCards.length;
		showFlashcard(category, index);
	}

	function showPrevFlashcard() {
		var currentFlashCard = model.getCurrentFlashCard();
		var category = currentFlashCard.category;
		var index = currentFlashCard.index;
		var flashCards = model.getFlashCards()[category];
		index = (index + flashCards.length - 1) % flashCards.length;
		showFlashcard(category, index);
	}

	function showFakePositionView() {
		colale.view.fakePosition.init();
		var fakePositionView_page = $(colale.view.fakePosition.page_id);
		$.mobile.changePage(fakePositionView_page);
	}

	function centerLocation() {
		view.fakePosition.centerPosition();
	}

	/*
	 * actual functionality from http://www.w3schools.com/html/html5_geolocation.asp
	 * (02.08.2014) (my contribution: adapted and put into namespace
	 * geolocation_api)
	 */
	showLocation = (function () {
		function show(msg) {
			alert(msg);
		}
		function showError(error) {
			function show(msg) {
				show(msg);
			}
			switch (error.code) {
			case error.PERMISSION_DENIED:
				show("User denied the request for Geolocation.");
				break;
			case error.POSITION_UNAVAILABLE:
				show("Location information is unavailable.");
				break;
			case error.TIMEOUT:
				show("The request to get user location timed out.");
				break;
			case error.UNKNOWN_ERROR:
				show("An unknown error occurred.");
				break;
			}
			colale.view.fakePosition.unsetBusy();
		}
		function getLatitude(position) {
			return position.coords.latitude;
		}
		function getLongitude(position) {
			return position.coords.longitude;
		}
		function getLocation(show_result) {
			colale.view.fakePosition.setBusy();
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function (position) {
					/*
					 * show("position:
					 * lat="+getLatitude(position)+", "+
					 * "long="+getLongitude(position));
					 */
					model.setLatitude(getLatitude(position));
					model.setLongitude(getLongitude(position));
					colale.view.fakePosition.unsetBusy();
					show_result({
						lat : getLatitude(position),
						lon : getLongitude(position)
					});
				}, showError, {
					timeout : 30000,
					enableHighAccuracy : true,
					maximumAge : 60000
				});
			} else {
				show("Geolocation is not supported by this browser.");
			}
		}

		return (function () {
			getLocation(function (pos) {
				//		view.fakePosition.refreshPosition(pos);
				view.fakePosition.centerPosition();
			});
		});
	})();

	function showPOIs() {
		//	colale.view.showGefundeneLernorte([
		//		{cat: "LernortX", dist: 10},
		//		{cat: "LernortY", dist: 10},
		//		{cat: "LernortZ", dist: 10}
		//	]);

		var longitude = model.getLongitude();
		var latitude = model.getLatitude();
		//	console.log("longitude: "+longitude);
		//	console.log("latitude: "+latitude);
		if (longitude == null || latitude == null) {
			return;
		}

		// console.log("refresh.click");
		view.fakePosition.setBusy();

		/* upper right corner of bbox:
		 * start at (latitude,longitude), go sqrt(2)*100m to NE (=45 degrees)
		 */
		var bbox_ur = colale.lib.bearing_and_dist_to_gps(latitude, longitude, 45, Math.sqrt(2) * model.getSetting("#colale_settings_radius"));
		var d_longitude = Math.abs(bbox_ur.lon - longitude);
		var d_latitude = Math.abs(bbox_ur.lat - latitude);
		//	console.log("bbox_ur: "+JSON.stringify(bbox_ur));
		//	console.log(bbox_ur.lon);
		//	console.log(bbox_ur.lat);
		//	console.log("d_longitude: "+d_longitude);
		//	console.log("d_latitude: "+d_latitude);
		/* lower left corner of bbox: sqrt(2)*100m to SW from (latitude,longitude) and
		 * upper right corner of bbox: sqrt(2)*100m to NE from (latitude, longitude)
		 * -> bbox contains circle with r=100m
		 */
		var long1 = longitude - d_longitude;
		var long2 = longitude + d_longitude;
		var lat1 = latitude - d_latitude;
		var lat2 = latitude + d_latitude;
		var bbox = "[bbox=" + long1 + "," + lat1 + "," + long2
			 + "," + lat2 + "]";

		/*
		 * When started from website www.odr6.de/colale/POI/...,
		 * then the URL has to be prefixed in order to invoke
		 * the CORS workaround.
		 */
		url_prefix = "";
		if (colale.lib.fromBrowser) {
			url_prefix = "../php/ba-simple-proxy.php?url=";
		}
		url = url_prefix
			 + "http://open.mapquestapi.com/xapi/api/0.6/node"
			 + bbox;
		// url="http://www.odr6.de/colale/POI/php/ba-simple-proxy.php?url=http://open.mapquestapi.com/xapi/api/0.6/node[bbox=8.235,50.0795,8.245000000000001,50.0825]";
		console.log("get " + url);
		$.get(
			url,
			function (data) {
			var pois = null;
			if (colale.lib.fromBrowser) {
				var xml = data.contents;
			} else {
				xml = data;
			}
			var pois = colale.lib.xml2json(xml);
			console.log("get returned data: " + JSON.stringify(pois));

			if (pois == undefined
				 || pois == null) {
				alert("OpenStreetMap liefert keine Resultate.");
				colale.view.fakePosition.unsetBusy();
				return;
			}

			var poilist = [];
			if (pois.node == undefined
				 || pois.node == null) {
				// console.log("keine
				// OpenStreetMap-Knoten
				// gefunden");
				// do nothing
			} else {
				var poiMap = model.getPOIMap();
				//			console.log("poiMap: "+JSON.stringify(poiMap));
				for (var n = 0; n < pois.node.length; n++) {
					var node = pois.node[n];
					var tags = node.tag;
					if (!(tags == undefined)
						 && !(tags == null)) {
						var lat = node.lat;
						var lon = node.lon;
						if (!(tags.k == undefined)
							 && !(tags.k == null)) {
							tags = [tags];
						}
						var poi_type = null;
						var poi_name = null;
						var poi_cat = null;
						for (var i = 0; i < tags.length; i++) {
							var tag = tags[i];
							if (poiMap[tag.k] && poiMap[tag.k][tag.v]) {
								poi_cat = poiMap[tag.k][tag.v];
								poi_type = tag.k + "/" + tag.v;
							}
							if (tag.k == "name") {
								poi_name = tag.v;
							}
						}
						if (!(poi_cat == null) && !(poi_type == null) && !(poi_name == null)) {
							var dist = Math.round(colale.lib.gps_dist(
										latitude, longitude, parseFloat(lat), parseFloat(lon)) / 5) * 5;
							if (dist <= model.getSetting("#colale_settings_radius")) {
								poilist[poilist.length] = {
									"dist" : dist,
									name : poi_name,
									cat : poi_cat,
									type : poi_type,
									"lat" : lat,
									"lon" : lon
								};
							}
						}
					}
				}
				poilist.sort(function (a, b) {
					return a.dist - b.dist;
				});
				model.setPOIList(poilist);
			}
			/*			var pl_html = "<h4>POIs in der Umgebung von "
			+ latitude
			+ "/"
			+ longitude
			+ "</h4>"
			+ "<ul>";
			pl_html = pl_html
			+ "<li>Person/<a href='http://www.openstreetmap.org/#map=20/"
			+ latitude
			+ "/"
			+ longitude
			+ "/' rel='external'>Ich</a> (person/important/0m)</li>";
			for (var i = 0; i < poilist.length; i++) {
			var pl_entry = poilist[i];
			pl_html = pl_html
			+ "<li>"
			+ pl_entry.cat +"/"
			+ "<a href='http://www.openstreetmap.org/#map=20/"
			+ pl_entry.lat + "/"
			+ pl_entry.lon
			+ "/' rel='external'>"
			+ pl_entry.name
			+ "</a> ("
			+ pl_entry.type + "/"
			+ pl_entry.dist
			+ "m)</li>";
			}
			pl_html = pl_html + "</ul>";
			$('#POIS_results_raw')
			.html(pl_html);
			 */
			colale.view.showGefundeneLernorte(poilist);
			colale.view.fakePosition.unsetBusy();
		})
		.fail(
			function () {
			alert("Zugriff auf OpenStreetMap nicht möglich.");
			colale.view.fakePosition.unsetBusy();
		});
		return;
	}

	// OOSO: We just want to track onclick events
	function showCategoryWrapper() {
		// Convert arguments to an array.
		var args = Array.prototype.slice.call(arguments, 0);
		console.log("A click received..." + args);

		FlurryAgent.logEvent("showCategory(" + args + ")"); // JS
		window.plugins.flurry.logEvent("showCategory(" + args + ")"); // Plugin
		GAnalyticsAgent.sendEvent("showCategory()", "(" + args + ")");

		// Call with the correct arguments list.
		return showCategory.apply(this, arguments);
	}
	
	function flurryTracker(event) {
		console.log("Tracking: " + arguments.callee.caller.name);
		//FlurryAgent.logEvent(event); // JS
		//console.log("FLURRY: " + JSON.stringify(window));
		window.plugins.flurry.logEvent(event); // Plugin
		GAnalyticsAgent.sendEvent(arguments.callee.caller.name + "", event);
	}

	//Options: throw an error if no update is received every 30 seconds.
	//
	//var watchID = navigator.geolocation.watchPosition(lib.onSuccessLocationUpdate, lib.onErrorLocationUpdate, { timeout: 10000 });
	
	function loadColaleSettings() {
		console.log("Loading and reseting initial values...");
		
		var colale_setting = "#" + "colale_settings_location";
		$(colale_setting).val(colale.model.getSetting(colale_setting));
		//$(colale_setting).slider("refresh");
		
		colale_setting = "#" + "colale_settings_language";
		$(colale_setting).val(colale.model.getSetting(colale_setting));
		document.webL10n.setLanguage(colale.model.getSetting(colale_setting));

		// Reset Spreche settings
		colale.model.setLastPageTranslated(1);
		colale.model.setLastLangTranslated(colale.model.getSetting(colale_setting));
		
		colale_setting = "#" + "colale_settings_gender";
		$(colale_setting).val(colale.model.getSetting(colale_setting));
		
		colale_setting = "#" + "colale_settings_gps";
		$(colale_setting).val(colale.model.getSetting(colale_setting));
		$(colale_setting).slider("refresh");
		
		colale_setting = "#" + "colale_settings_radius";
		$(colale_setting).val(colale.model.getSetting(colale_setting));
		//console.log("Radius: " + $("#radius_slider").html());
		//$(colale_setting).slider( "option", {"value" : colale.model.getSetting(colale_setting)});
		$(colale_setting).slider("refresh");
		//console.log("RADIUS val: " + JSON.stringify(colale.model.getSetting(colale_setting)));
		//$(colale_setting).slider("value", parseInt(colale.model.getSetting(colale_setting)));
		//$(colale_setting).slider( "option", {"value" : colale.model.getSetting(colale_setting)});
		//$(colale_setting).slider("refresh");
		
		// Reset sprache management
		/*
		colale.model.setLastPageTranslated(1); // Lokales
		colale.model.setLastLangTranslated(colale.model.getSetting("#colale_settings_language"));
		*/
	}
	
	function saveColaleSettings(control) {
		//console.log("Control: " + control.id);
		var value = "";
		switch (control.id) {
			case "colale_settings_location":
				value = control.value;
				break;
			case "colale_settings_language":
				value = control.value;
				document.webL10n.setLanguage(value);
				
				// OOSO: bug with select controls
				colale_setting = "#" + "colale_settings_gender";
				$(colale_setting).val(colale.model.getSetting(colale_setting));
						
				colale_setting = "#" + "colale_settings_location";
				$(colale_setting).val(colale.model.getSetting(colale_setting));
				//console.log("Location2: " + $("#colale_settings_location_div").html());
				/*
				//$("#colale_settings_location").trigger("chosen:updated");
				console.log("VAL1: " + $("#colale_settings_location option:selected").text());
				//$("#colale_settings_location").selectmenu("refresh", true);
				console.log("VAL2: " + $("#colale_settings_location option:selected").text());
				console.log("VAL31: " + $("#colale_settings_gender option:selected").text());
				console.log("VAL32: " + $("#colale_settings_gender option:selected").val());
				
				$('#colale_settings_gender').val($("#colale_settings_gender option:selected").val()).change();
				*/
				break;
			case "colale_settings_gender":
				value = control.value;
				break;
			case "colale_settings_radius":
				value = control.value;
				break;
			case "colale_settings_gps":
				value = control.value;
				// FIX ME: finish previous task and start a new one with this value!!!
				break;

		}
		//console.log("Control: " + control.id + ", " + value);
		colale.model.setSetting("#" + control.id, value);
	}

	function showPOIsFromLocal(progressBar) {
	
		//	colale.view.showGefundeneLernorte([
		//		{cat: "LernortX", dist: 10},
		//		{cat: "LernortY", dist: 10},
		//		{cat: "LernortZ", dist: 10}
		//	]);

		var longitude = model.getLongitude();
		var latitude = model.getLatitude();
		
		console.log("longitude: "+longitude);
		console.log("latitude: "+latitude);
		if (longitude == null || latitude == null) {
			return;
		}

		// console.log("refresh.click");
		//view.fakePosition.setBusy();

		/* upper right corner of bbox:
		 * start at (latitude,longitude), go sqrt(2)*100m to NE (=45 degrees)
		 */
		var bbox_ur = colale.lib.bearing_and_dist_to_gps(latitude, longitude, 45, Math.sqrt(2) * model.getSetting("#colale_settings_radius"));
		var d_longitude = Math.abs(bbox_ur.lon - longitude);
		var d_latitude = Math.abs(bbox_ur.lat - latitude);
		//	console.log("bbox_ur: "+JSON.stringify(bbox_ur));
		//	console.log(bbox_ur.lon);
		//	console.log(bbox_ur.lat);
		//	console.log("d_longitude: "+d_longitude);
		//	console.log("d_latitude: "+d_latitude);
		/* lower left corner of bbox: sqrt(2)*100m to SW from (latitude,longitude) and
		 * upper right corner of bbox: sqrt(2)*100m to NE from (latitude, longitude)
		 * -> bbox contains circle with r=100m
		 */
		var long1 = longitude - d_longitude;
		var long2 = longitude + d_longitude;
		var lat1 = latitude - d_latitude;
		var lat2 = latitude + d_latitude;
		var bbox = "[bbox=" + long1 + "," + lat1 + "," + long2
			 + "," + lat2 + "]";

		/*
		 * When started from website www.odr6.de/colale/POI/...,
		 * then the URL has to be prefixed in order to invoke
		 * the CORS workaround.
		 */
		url_prefix = "";
		if (colale.lib.fromBrowser) {
			url_prefix = "../php/ba-simple-proxy.php?url=";
		}
		url = url_prefix
			 + "http://open.mapquestapi.com/xapi/api/0.6/node"
			 + bbox;
		// url="http://www.odr6.de/colale/POI/php/ba-simple-proxy.php?url=http://open.mapquestapi.com/xapi/api/0.6/node[bbox=8.235,50.0795,8.245000000000001,50.0825]";
		console.log("get " + url);
		$.get(
			url,
			function (data) {
			var pois = null;
			if (colale.lib.fromBrowser) {
				var xml = data.contents;
			} else {
				xml = data;
			}
			var pois = colale.lib.xml2json(xml);
			console.log("get returned data: " + JSON.stringify(pois));

			if (pois == undefined
				 || pois == null) {
				alert("OpenStreetMap liefert keine Resultate.");
				//colale.view.fakePosition.unsetBusy();
				return;
			}

			var poilist = [];
			if (pois.node == undefined
				 || pois.node == null) {
				// console.log("keine
				// OpenStreetMap-Knoten
				// gefunden");
				// do nothing
			} else {
				var poiMap = model.getPOIMap();
							console.log("poiMap: "+JSON.stringify(poiMap));
				for (var n = 0; n < pois.node.length; n++) {
					var node = pois.node[n];
					var tags = node.tag;
					if (!(tags == undefined)
						 && !(tags == null)) {
						var lat = node.lat;
						var lon = node.lon;
						if (!(tags.k == undefined)
							 && !(tags.k == null)) {
							tags = [tags];
						}
						var poi_type = null;
						var poi_name = null;
						var poi_cat = null;
						for (var i = 0; i < tags.length; i++) {
							var tag = tags[i];
							if (poiMap[tag.k] && poiMap[tag.k][tag.v]) {
								poi_cat = poiMap[tag.k][tag.v];
								poi_type = tag.k + "/" + tag.v;
							}
							if (tag.k == "name") {
								poi_name = tag.v;
							}
						}
						if (!(poi_cat == null) && !(poi_type == null) && !(poi_name == null)) {
							var dist = Math.round(colale.lib.gps_dist(
										latitude, longitude, parseFloat(lat), parseFloat(lon)) / 5) * 5;
							if (dist <= model.getSetting("#colale_settings_radius")) {
								poilist[poilist.length] = {
									"dist" : dist,
									name : poi_name,
									cat : poi_cat,
									type : poi_type,
									"lat" : lat,
									"lon" : lon
								};
							}
						}
					}
				}
				poilist.sort(function (a, b) {
					return a.dist - b.dist;
				});
				model.setPOIList(poilist);
			}
			/*			var pl_html = "<h4>POIs in der Umgebung von "
			+ latitude
			+ "/"
			+ longitude
			+ "</h4>"
			+ "<ul>";
			pl_html = pl_html
			+ "<li>Person/<a href='http://www.openstreetmap.org/#map=20/"
			+ latitude
			+ "/"
			+ longitude
			+ "/' rel='external'>Ich</a> (person/important/0m)</li>";
			for (var i = 0; i < poilist.length; i++) {
			var pl_entry = poilist[i];
			pl_html = pl_html
			+ "<li>"
			+ pl_entry.cat +"/"
			+ "<a href='http://www.openstreetmap.org/#map=20/"
			+ pl_entry.lat + "/"
			+ pl_entry.lon
			+ "/' rel='external'>"
			+ pl_entry.name
			+ "</a> ("
			+ pl_entry.type + "/"
			+ pl_entry.dist
			+ "m)</li>";
			}
			pl_html = pl_html + "</ul>";
			$('#POIS_results_raw')
			.html(pl_html);
			 */
			 
			//colale.view.showGefundeneLernorte(poilist);
			//console.log("DATA: " + JSON.stringify(poilist));
			//colale.view.fakePosition.unsetBusy();
			/*
			var categories = [];
			var pois = [];
			for (i=0; i<poilist.length; i++) {
				var item = poilist[i];
				if (categories.indexOf(item["cat"]) == -1) {
					categories[categories.length] = item["cat"];
				}
				pois[pois.length] = (i+1) + ". " + item["name"] + " (" + item["dist"] + "m.)";
			}
			*/
			// Clear POIs without categories
			var data = clearUnlinkedPois(poilist);
			var pois = [];
			var categories = {};
			
			//userPoiCategories[currentPoiName] = {"poiAddress": currentPoiAddress, "location": currentPoiLocation, "categories":categories};
			var userCategories = model.getUserPoiCategories();
			for (i=0, length=data['pois'].length; i<length; i++) {
				var item = data['pois'][i];
				// Build the list of surrounding POIs
				pois[pois.length] = (i+1) + ". " + item["name"] + " (" + item["dist"] + "m.)";
				
				// Build the list of linked categories
				if (userCategories != null && userCategories[item["name"]] != undefined) {
					var cat = userCategories[item["name"]]['categories'];
					
					for (var categoryName in cat) {
						if (cat.hasOwnProperty(categoryName)) {
							if (cat[categoryName] == true) { // checked??
								categories[categoryName] = categoryName;
							}
						}
					}
				} else {
					categories[item["cat"]] = item["cat"];
				}				
			}
			
			// Convert categories {} to []
			var keys = [];
			for (key in categories) {
				if (categories.hasOwnProperty(key)) { 
					keys[keys.length] = key; 
				}
			} 
			view.categoriesListLBS.show(keys);
			view.categoriesListLBS.showPOIs(pois);
			
			progressBar.deactivate();
		})
		.fail(
			function () {
			alert("Zugriff auf OpenStreetMap nicht möglich.");
			//colale.view.fakePosition.unsetBusy();
			progressBar.deactivate();
		});
		return;
	}

	function clearUnlinkedPois(poiList) {
		var categories = colale.model.getPOICategories();
		var includedCategories = {};
		var cleanPoiList = [];
		
		for (j=0, plength=poiList.length; j<plength; j++) {
			var entry = poiList[j];
			var i=0, length=categories.length;
			
			includedCategories[entry["cat"]] = entry["cat"];
			
			for (; i<length; i++)
				if (categories[i] == entry["cat"])
					break;
			if (i < length)
				cleanPoiList[cleanPoiList.length] = entry;
			else {}
				// Ignore current entry
		}
		
		console.log("Categories: " + JSON.stringify(includedCategories));
		console.log("Dirty: " + JSON.stringify(poiList));
		console.log("Clean: " + JSON.stringify(cleanPoiList));
		
		return {
			"categories" : includedCategories,
			"pois": cleanPoiList
			};
	}
	
	function getDataFromCurrentLocation () {
		// Debug location.
		/*
		model.setLatitude (50.1074409);
		model.setLongitude(8.5861554);
		*/
		flurryTracker("getDataFromCurrentLocation -> No args");
		var result = showPOIsFromSettings(clearUnlinkedPois);
		/*
		if (!result) {
			console.log("We cannot get the current POIs...");
			return null;
		}
		
		var currentData = clearUnlinkedPois(model.getPOIList());
		*/
		return null;
	}
	
	function showPOIsFromSettings(callback) {
		var progressBar = new view.Progressbar('colale-map-progressbar');
		progressBar.activate();
		
		//	colale.view.showGefundeneLernorte([
		//		{cat: "LernortX", dist: 10},
		//		{cat: "LernortY", dist: 10},
		//		{cat: "LernortZ", dist: 10}
		//	]);

		var longitude = model.getLongitude();
		var latitude = model.getLatitude();
			//console.log("longitude: "+longitude);
			//console.log("latitude: "+latitude);
		if (longitude == null || latitude == null) {
			return;
		}

		// console.log("refresh.click");
		//view.fakePosition.setBusy();

		/* upper right corner of bbox:
		 * start at (latitude,longitude), go sqrt(2)*100m to NE (=45 degrees)
		 */
		var bbox_ur = colale.lib.bearing_and_dist_to_gps(latitude, longitude, 45, Math.sqrt(2) * model.getSetting("#colale_settings_radius"));
		var d_longitude = Math.abs(bbox_ur.lon - longitude);
		var d_latitude = Math.abs(bbox_ur.lat - latitude);
		//	console.log("bbox_ur: "+JSON.stringify(bbox_ur));
		//	console.log(bbox_ur.lon);
		//	console.log(bbox_ur.lat);
		//	console.log("d_longitude: "+d_longitude);
		//	console.log("d_latitude: "+d_latitude);
		/* lower left corner of bbox: sqrt(2)*100m to SW from (latitude,longitude) and
		 * upper right corner of bbox: sqrt(2)*100m to NE from (latitude, longitude)
		 * -> bbox contains circle with r=100m
		 */
		var long1 = longitude - d_longitude;
		var long2 = longitude + d_longitude;
		var lat1 = latitude - d_latitude;
		var lat2 = latitude + d_latitude;
		var bbox = "[bbox=" + long1 + "," + lat1 + "," + long2
			 + "," + lat2 + "]";

		/*
		 * When started from website www.odr6.de/colale/POI/...,
		 * then the URL has to be prefixed in order to invoke
		 * the CORS workaround.
		 */
		url_prefix = "";
		if (colale.lib.fromBrowser) {
			url_prefix = "../php/ba-simple-proxy.php?url=";
		}
		url = url_prefix
			 + "http://open.mapquestapi.com/xapi/api/0.6/node"
			 + bbox;
		// url="http://www.odr6.de/colale/POI/php/ba-simple-proxy.php?url=http://open.mapquestapi.com/xapi/api/0.6/node[bbox=8.235,50.0795,8.245000000000001,50.0825]";
		console.log("get " + url);
		$.get(
			url,
			function (data) {
			var pois = null;
			if (colale.lib.fromBrowser) {
				var xml = data.contents;
			} else {
				xml = data;
			}
			var pois = colale.lib.xml2json(xml);
			console.log("get returned data: " + JSON.stringify(pois));

			if (pois == undefined
				 || pois == null) {
				alert("OpenStreetMap liefert keine Resultate.");
				colale.view.fakePosition.unsetBusy();
				return;
			}

			var poilist = [];
			if (pois.node == undefined
				 || pois.node == null) {
				// console.log("keine
				// OpenStreetMap-Knoten
				// gefunden");
				// do nothing
			} else {
				var poiMap = model.getPOIMap();
				//			console.log("poiMap: "+JSON.stringify(poiMap));
				for (var n = 0; n < pois.node.length; n++) {
					var node = pois.node[n];
					var tags = node.tag;
					if (!(tags == undefined)
						 && !(tags == null)) {
						var lat = node.lat;
						var lon = node.lon;
						if (!(tags.k == undefined)
							 && !(tags.k == null)) {
							tags = [tags];
						}
						var poi_type = null;
						var poi_name = null;
						var poi_cat = null;
						for (var i = 0; i < tags.length; i++) {
							var tag = tags[i];
							if (poiMap[tag.k] && poiMap[tag.k][tag.v]) {
								poi_cat = poiMap[tag.k][tag.v];
								poi_type = tag.k + "/" + tag.v;
							}
							if (tag.k == "name") {
								poi_name = tag.v;
							}
						}
						if (!(poi_cat == null) && !(poi_type == null) && !(poi_name == null)) {
							var dist = Math.round(colale.lib.gps_dist(
										latitude, longitude, parseFloat(lat), parseFloat(lon)) / 5) * 5;
							if (dist <= model.getSetting("#colale_settings_radius")) {
								poilist[poilist.length] = {
									"dist" : dist,
									name : poi_name,
									cat : poi_cat,
									type : poi_type,
									"lat" : lat,
									"lon" : lon
								};
							}
						}
					}
				}
				poilist.sort(function (a, b) {
					return a.dist - b.dist;
				});
				model.setPOIList(poilist);
				var pois = callback(poilist);
				colale.view.poisList.show(pois['pois']);
				
				progressBar.deactivate();
			}
			
			//colale.view.showGefundeneLernorte(poilist);
			//colale.view.fakePosition.unsetBusy();
		})
		.fail(
			function () {
			alert("Zugriff auf OpenStreetMap nicht möglich.");
			//colale.view.fakePosition.unsetBusy();
			progressBar.deactivate();
		});
		return ;
	}

	function showPoiList(poiName, categoryName, poiDist) {
		flurryTracker("showPoiCategoryList: " + poiName + ", " + categoryName + ", " + poiDist);

		model.setCurrentPoiName(poiName);
		model.setCurrentPoiCategory(categoryName);
		model.setCurrentPoiDistance(poiDist);

		view.poisCategories.show();
		
		//var flashcard_page = $("#colale_settings_pois_results_content");
		//$.mobile.changePage(flashcard_page);
	}
		
	function showUserPois() {
		flurryTracker("showUserPois -> No args");
		view.userPoisList.show();
	}
	
	function clearPoiCategoriesCheckboxes() {
		flurryTracker("clearPoiCategoriesCheckboxes -> No args");
		
		$("#categories_checkboxes input[type='checkbox']").each(function() {
			$(this).prop('checked', false);
			$(this).checkboxradio('refresh');
			//console.log($(this).attr('name') + "," + $(this).attr('checked'));
			//console.log("Button: " + $(this).parent().find(".ui-btn-text").text());
		});
	}
	
	function savePoiCategoriesCheckboxes() {
		flurryTracker("savePoiCategoriesCheckboxes -> No args");

		// FIX ME: I don't care about space, save all just for simplicity
		var categories = {};
		$("#categories_checkboxes input[type='checkbox']").each(function() {
			categories[$(this).attr('name')] = $(this).prop('checked');
		});
		
		var userPoiCategories = model.getUserPoiCategories();
		var currentPoiName = model.getCurrentPoiName();
		var currentPoiAddress = model.getCurrentPoiAddress();
		var currentPoiLocation = model.getLatitude() + "x" + model.getLongitude();
		
		if (userPoiCategories == null) {
			userPoiCategories = {};
		}
		
		userPoiCategories[currentPoiName] = {"poiAddress": currentPoiAddress, "location": currentPoiLocation, "categories":categories};
		model.setUserPoiCategories(userPoiCategories);
		console.log("userCategories: " + JSON.stringify(userPoiCategories));
		
		alert("POI <" + currentPoiName + "> saved.");
	}
	
	function deletePoiCategoriesCheckboxes() {
		flurryTracker("deletePoiCategoriesCheckboxes");
		var userPoiCategories = model.getUserPoiCategories();
		var currentPoiName = model.getCurrentPoiName();
		
		if (userPoiCategories.hasOwnProperty(currentPoiName)) {
			delete userPoiCategories[currentPoiName];
			model.setUserPoiCategories(userPoiCategories);
			// Clean checkboxes
			$("#categories_checkboxes input[type='checkbox']").each(function() {
				$(this).prop('checked', false);
				$(this).checkboxradio('refresh');
			});
			
			console.log("Categories: " + JSON.stringify(userPoiCategories));
			
			alert("POI <" + currentPoiName + "> deleted.");
		} else {
			alert("First save POI <" + currentPoiName + "> and then you can delete it.");
		}
	}

	// Settings options
	function showColaleSettingsManagePlaces() {
		flurryTracker("showColaleSettingsManagePlaces -> No args");
		var home_page=$("#colale_settings_wortlisten_menu");
		$.mobile.changePage(home_page);
	}
	
	function showColaleSettingsMap() {
		flurryTracker("showColaleSettingsMap -> No args");
		var home_page=$("#colale_settings_map");
		$.mobile.changePage(home_page);
	}
	
	// Tabbar functions
	function showColaleLokales(control) {		
		// onSuccess Callback
		// This method accepts a Position object, which contains the
		// current GPS coordinates
		//
		var onSuccess = function(position) {
			$("#colale_debug_location").text('Latitude: '          + position.coords.latitude          + '\n' +
				  'Longitude: '         + position.coords.longitude         + '\n' +
				  'Altitude: '          + position.coords.altitude          + '\n' +
				  'Accuracy: '          + position.coords.accuracy          + '\n' +
				  'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
				  'Heading: '           + position.coords.heading           + '\n' +
				  'Speed: '             + position.coords.speed             + '\n' +
				  'Timestamp: '         + position.timestamp                + '\n');
			console.log('Latitude: '          + position.coords.latitude          + '\n' +
				  'Longitude: '         + position.coords.longitude         + '\n' +
				  'Altitude: '          + position.coords.altitude          + '\n' +
				  'Accuracy: '          + position.coords.accuracy          + '\n' +
				  'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
				  'Heading: '           + position.coords.heading           + '\n' +
				  'Speed: '             + position.coords.speed             + '\n' +
				  'Timestamp: '         + position.timestamp                + '\n');
			
			// If we reach the distance threashold, then make the request
			/*
			var dist = lib.gps_dist(model.getLatitude(), model.getLongitude(), 
				position.coords.latitude, position.coords.longitude);

			model.setLongitude(position.coords.longitude);
			model.setLatitude( position.coords.latitude);

			if (dist < constants.getRefreshDistance() && colaleRuns > 0) {
				// Do nothing
				progressBar.deactivate();
				console.log("In the distance threashold ... " + dist);
				return;
			}
			colaleRuns++;
			*/
			model.setLongitude(position.coords.longitude);
			model.setLatitude( position.coords.latitude);
			//console.log("Radius: " + model.getSetting("#colale_settings_radius"));
			showPOIsFromLocal(progressBar);
			
			//var home_page=$("#colale_locales_LBS_categories");
		};

		// onError Callback receives a PositionError object
		//
		function onError(error) {
			progressBar.deactivate();
			alert('code: '    + error.code    + '\n' +
				  'message: ' + error.message + '\n');
		}
		

		flurryTracker("showColaleLokales -> no args");
		console.log("Starting colale lokales...");
		var home_page=$("#colale_locales");
		$.mobile.changePage(home_page);
		
		if (model.getSetting("#colale_settings_location") == "off") {
			return;
		}
		
		var progressBar = new view.Progressbar('colale-lokales-progressbar');
		progressBar.activate();

		//console.log("LOKALES: " + home_page.html());
		
		// Get POIs from current position
		var options = { timeout: 31000, 
				enableHighAccuracy: true, 
				maximumAge: 90000 };
		navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
	}
	
	function showColaleSpreche(currentPage) {
		var currentLang = colale.model.getSetting("#colale_settings_language");
		var last_page_translated = colale.model.getLastPageTranslated();
		var last_lang_translated = colale.model.getLastLangTranslated();
		
		function getNextLang(lang) {
			return lang.localeCompare("de") == 0 ? "th" : "de";
		}
		
		function translatePage(pageId, pageLang) {
			switch (pageId) {
				case  1: // Locales main
					document.webL10n.translate2(pageLang, document.getElementById("colale_locales_NonLBS_categories"));
					document.webL10n.translate2(pageLang, document.getElementById("colale_locales_LBS_categories"));
					document.webL10n.translate2(pageLang, document.getElementById("colale_locales_POIs"));
					break;
				case  2: // Locales flashcard list
					document.webL10n.translate2(pageLang, document.getElementById("colale-flashcard-list"));
					break;
				case  3: // Alle Listen categories
					document.webL10n.translate2(pageLang, document.getElementById("colale-category-list"));
					break;
				case  4: // Alle Listen flashcard list
				case  5: // Alle Listen flashcard
					break;
				case  6: // Settings main
					document.webL10n.translate2(pageLang, document.getElementById("colale_settings_main"));
					break;
				case  7: // Settings new place
					document.webL10n.translate2(pageLang, document.getElementById("colale_settings_places"));
					break;
				case  8: // Settings use current position
					document.webL10n.translate2(pageLang, document.getElementById("colale_settings_current_position"));
					break;
				case  9: // Settings POIs list
					document.webL10n.translate2(pageLang, document.getElementById("colale_settings_pois_list"));
					break;
				case 10: // Settings wortlisten
					document.webL10n.translate2(pageLang, document.getElementById("current_pois_content"));
					break;
				case 11: // Setttings address search
					break;
				case 12: // Settings modify user POI-Categories
					document.webL10n.translate2(pageLang, document.getElementById("colale_settings_user_pois_content"));
					break;
				case 13: // Helper!!!
					document.webL10n.translate2(pageLang, document.getElementById("colale_helper"));
			}
		}
		
		if (last_page_translated == null || last_page_translated == 0)
			last_page_translated = currentPage;
		if (last_lang_translated == null)
			last_lang_translated = currentLang;
			
		if (last_page_translated == currentPage)
			currentLang = getNextLang(last_lang_translated);
		else
			currentLang = getNextLang(currentLang);
		
		flurryTracker("showColaleSpreche -> " +colale.model.getSetting("#colale_settings_language") + ": " + currentPage + ", " + currentLang + ", " + last_page_translated + ", " + last_lang_translated);

		console.log("Spreche["+colale.model.getSetting("#colale_settings_language")+"]: " + currentPage + ", " + currentLang + ", " + last_page_translated + ", " + last_lang_translated);
		
		// Reset previous page to original lang
		translatePage(last_page_translated, colale.model.getSetting("#colale_settings_language"));
		// Translate requested page
		translatePage(currentPage, currentLang);
		// Set the original lang
		translatePage(13, colale.model.getSetting("#colale_settings_language"));
		//document.webL10n.setLanguage(colale.model.getSetting("#colale_settings_language"));
		
		colale.model.setLastPageTranslated(currentPage);
		colale.model.setLastLangTranslated(currentLang);
				
		
		
		/*
		if (lang.localeCompare("de") == 0)
			//document.webL10n.setLanguage("th");
			lang = "th";
		else
			//document.webL10n.setLanguage("de");
			lang = "de";
		//document.webL10n.setLanguage(lang);
		//l10n.translate(document.getElementById(currentPage));
		console.log("HTML: " + $("#colale_locales_LBS_categories").html());
		document.webL10n.translate2(lang, document.getElementById(currentPage));
		
		//document.webL10n.setLanguage(lang);
		*/
	}
	
	function showColaleAlleListen() {
		flurryTracker("showColaleAlleListen -> No args");
		var home_page=$("#colale_select_flashcards");
		$.mobile.changePage(home_page);
	}

	function showColaleSettings() {
		flurryTracker("showColaleSettings -> No args");
		var home_page=$("#colale_settings");
		$.mobile.changePage(home_page);
	}
	
	var control_modul = {
		"init" : init,
		"showFlashcard" : showFlashcard,
		//"showCategory": showCategory,
		"showCategory" : showCategoryWrapper,
		"showNextFlashcard" : showNextFlashcard,
		"showPrevFlashcard" : showPrevFlashcard,
		"showFakePositionView" : showFakePositionView,
		"showPOIs" : showPOIs,
		"showPOI" : showPOI,
		"showLocation" : showLocation,
		"centerLocation" : centerLocation,
		
		// OOSO
		"showFlashcardList" : showFlashcardList,
		"loadColaleSettings" : loadColaleSettings,
		"saveColaleSettings" : saveColaleSettings,
		"showColaleLokales" : showColaleLokales,
		"showColaleSpreche" : showColaleSpreche,
		"showColaleAlleListen" : showColaleAlleListen,
		"showColaleSettings" : showColaleSettings,
		"showColaleSettingsManagePlaces" : showColaleSettingsManagePlaces,
		"showColaleSettingsMap" : showColaleSettingsMap,
		
		"getDataFromCurrentLocation" : getDataFromCurrentLocation,
		"showPoiList" : showPoiList,
		"clearPoiCategoriesCheckboxes" : clearPoiCategoriesCheckboxes,
		"savePoiCategoriesCheckboxes" : savePoiCategoriesCheckboxes,
		"deletePoiCategoriesCheckboxes" : deletePoiCategoriesCheckboxes,
		
		"showUserPois" : showUserPois,
		"flurryTracker" : flurryTracker,
	}
	return control_modul;
})();