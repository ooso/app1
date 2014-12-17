colale.view = (function () {
	console.log("init colale.view");

	var lib = colale.lib;
	var model = colale.model;
	var view = {};

	view.assignFlashCards = (function () {
		var assign_id = colale.lib.hash_symbol + "colale_assign";
		var page_id = assign_id;
		var list_id = "#colale_assign_list";

		function init() {
			console.log("assignFlashCards.init");
			var poiCategories = model.getPOICategories();
			var flashCards = model.getFlashCards();
			var poiAssignment = {};
			for (var i = 0; i < poiCategories.length; i++) {
				poiAssignment[poiCategories[i]] = [];
			}
			var unassigned = [];
			for (cat in flashCards) {
				if (poiAssignment[cat]) {
					assignment = poiAssignment[cat];
					assignment[assignment.length] = cat;
				} else {
					unassigned[unassigned.length] = cat;
				}
			}
			//		console.log("poiAssignment: "+JSON.stringify(poiAssignment));
			unassigned.sort();

			var assignmentList = [];
			for (cat in poiAssignment) {
				assignmentList[assignmentList.length] = {
					"cat" : cat,
					"flashcards" : poiAssignment[cat]
				}
			}
			assignmentList.sort(function (a, b) {
				if (a > b) {
					return 1;
				} else {
					return -1;
				}
			});
			for (var i = assignmentList.length; i > 0; i--) {
				assignmentList[i] = assignmentList[i - 1];
			}
			assignmentList[0] = {
				"cat" : "Ohne Zuordnung",
				"flashcards" : unassigned
			};
			//		console.log("assignmentList: "+JSON.stringify(assignmentList));
			var list = $(list_id);
			list.contents().remove();
			for (var i = 0; i < assignmentList.length; i++) {
				if (!(assignmentList[i].cat == "Ohne Zuordnung")) {
					list.append(
						"<li data-role='list-divider' role='heading'>" +
						"POI: " + assignmentList[i].cat +
						"</li>");
				}
				flashcards = assignmentList[i].flashcards;
				for (var j = 0; j < flashcards.length; j++) {
					list.append(
						"<li data-theme=''>" +
						"<a href=\"javascript:colale.control.showCategory('" +
						flashcards[j] + "', '" + page_id +
						"')\">" +
						"Lernkarten: " + flashcards[j] +
						"</a>" +
						"</li>");
				}
				/* gefakte Geofences */
				if (assignmentList[i].cat == "Ohne Zuordnung") {
					list.append(
						"<li data-role='list-divider' role='heading'>" +
						"Geo: daheim" +
						"</li>");
					list.append(
						"<li data-role='list-divider' role='heading'>" +
						"Geo: Hochschule" +
						"</li>");
				}
			}
			list.sortable();
			list.disableSelection();
			list.sortable({
				cancel : "[role='heading']"
			});
		}

		return {
			"init" : init
		};
	})();

	view.fakePosition = (function () {
		var page_id = "#colale_fake_position";
		var map_id = "colale_fake_position_map";
		var progressbar_id = "colale_fake_position_progressbar";
		var button_id = ".colale_fake_position_hide_button";
		var pbar = null;
		var proj900913 = new OpenLayers.Projection("EPSG:900913");
		var proj4326 = new OpenLayers.Projection("EPSG:4326");

		var map = null;

		function refreshPosition(pos) {
			console.log("refreshPosition(" + JSON.stringify(pos) + ")");
			if (map == null) {
				return;
			}
			var point = new OpenLayers.Geometry.Point(pos.lon, pos.lat);
			point.transform(proj4326, proj900913);
			drawPosition(polygonLayer, point.x, point.y);
			$(button_id).css("visibility", "visible");
		}
		function centerPosition() {
			if (map == null) {
				return;
			}
			pos = {
				lon : model.getLongitude(),
				lat : model.getLatitude()
			};
			if (pos.lon == null || pos.lat == null) {
				return;
			}
			console.log("centerPosition(" + JSON.stringify(pos) + ")");
			var point = new OpenLayers.Geometry.Point(pos.lon, pos.lat);
			point.transform(proj4326, proj900913);
			map.setCenter(
				[point.x, point.y], // lonlat,
				15, // zoom,
				true, // dragging,
				true // forceZoomChange
			);
			polygonLayer.redraw();
			drawPosition(polygonLayer, point.x, point.y);
			$(button_id).css("visibility", "visible");
		}

		function drawPosition(polygonLayer, metricLon, metricLat) {
			console.log("drawPosition(" + metricLon + ", " + metricLat + ")");
			var point = new OpenLayers.Geometry.Point(metricLon, metricLat);
			var circleFeature = new OpenLayers.Feature.Vector(
					OpenLayers.Geometry.Polygon
					.createRegularPolygon(
						point,
						model.getSetting("#colale_settings_radius"),
						30,
						0));
			var pointFeature = new OpenLayers.Feature.Vector(
					point, {
					description : 'info'
				}, {
					externalGraphic : 'img/marker.png',
					graphicHeight : 25,
					graphicWidth : 21,
					graphicXOffset : -12,
					graphicYOffset : -25
				});
			polygonLayer.removeAllFeatures();
			polygonLayer.addFeatures([circleFeature, pointFeature]);
		}

		function init() {
			//		console.log("view.fakePosition init");

			pbar = new view.Progressbar(progressbar_id);

			var map_width = $(window).width();
			var map_height = map_width * 2 / 3;
			//		console.log("w,h: "+map_width+", "+map_height);
			$("#colale_fake_position_map").width(map_width);
			$("#colale_fake_position_map").height(map_height);

			map = new OpenLayers.Map(map_id);
			var mapLayer = new OpenLayers.Layer.OSM();
			map.addLayer(mapLayer);

			//		console.log("map.getSize(): "+map.getSize());
			map.zoomToMaxExtent();
			polygonLayer = new OpenLayers.Layer.Vector("Polygon Layer");
			map.addLayer(polygonLayer);

			var lon = model.getLongitude();
			var lat = model.getLatitude();
			if (!(lon == null) && !(lat == null)) {
				refreshPosition({
					"lat" : lat,
					"lon" : lon
				});
			} else {
				$(button_id).css("visibility", "hidden");
			}

			OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
					defaultHandlerOptions : {
						'single' : true,
						'double' : false,
						'pixelTolerance' : 0,
						'stopSingle' : false,
						'stopDouble' : false
					},

					initialize : function (options) {
						this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
						OpenLayers.Control.prototype.initialize.apply(
							this, arguments);
						this.handler = new OpenLayers.Handler.Click(
								this, {
								'click' : this.trigger
							}, this.handlerOptions);
					},

					trigger : function (e) {
						var metricPoint = map.getLonLatFromPixel(e.xy);
						drawPosition(polygonLayer, metricPoint.lon, metricPoint.lat);

						var latLon = metricPoint.clone().transform(proj900913, proj4326);
						model.setLatitude(latLon.lat);
						model.setLongitude(latLon.lon);

						$(button_id).css("visibility", "visible");
					}
				});

			var click = new OpenLayers.Control.Click();
			map.addControl(click);
			click.activate();

			colale.view.fakePosition.init = function () {
				//			console.log("view.fakePosition wiederholtes init");
			}
		}

		return {
			"page_id" : page_id,
			"init" : init,
			"setBusy" : function () {
				pbar.activate();
			},
			"unsetBusy" : function () {
				pbar.deactivate();
			},
			"refreshPosition" : refreshPosition,
			"centerPosition" : centerPosition
		}
	})();

	view.categoriesListOLD = (function () {
		var page_id = colale.lib.hash_symbol + "colale_select_flashcards";
		var category_list_id = "#colale-category-list";
		var template_element_class = ".colale-template-element";
		var li_with_heading_role = "[role='heading']";
		var regular_li = "[role!='heading']";

		function init() {
			var flashCards = model.getFlashCards();
			var li_template = $(category_list_id).
				find(regular_li + ":first").clone();
			$(category_list_id).
			find(regular_li).
			remove();
			for (var cat in flashCards) {
				var li = li_template.clone();
				var te = li.find(template_element_class);
				te.text(cat);
				te.attr("href",
					"javascript:colale.control.showFlashcardList('" +
					cat + "', '" + page_id +
					"')");
				// ensure that the value of cat is _copied_ to the context
				// of the call-back funtion showCategory
				$("#colale-category-list").append(li);
			}
		}
		return {
			"init" : init
		};
	})();

	view.categoriesList = (function () {
		var page_id = colale.lib.hash_symbol + "colale_select_flashcards";
		var category_list_id = "#colale-category-list";
		var template_element_class = ".colale-category-template-element";
		var li_with_heading_role = "[role='heading']";
		var regular_li = "[role!='heading']";
		
		var colale_locales_NonLBS_categories = "#colale_locales_NonLBS_categories";
		
		function init() {
			var flashCards = model.getFlashCards();
			var li_template = $(category_list_id).
				find(template_element_class).clone();
			$(category_list_id).
			find(template_element_class).
			remove();
			
			var index = 1;
			for (var cat in flashCards) {
				var li = li_template.clone();
				//li.text(cat);
				//li.text("<span data-l10n-id=\"cat" + index.pad(2) + "00\">" + cat + "</span>");
				li.text("");
				li.append("<span data-l10n-id=\"cat" + index.pad(2) + "00\">" + cat + "</span>");
				li.attr("href",
					"javascript:colale.control.showFlashcardList('" +
					cat + "', '" + page_id +
					"')");
				// ensure that the value of cat is _copied_ to the context
				// of the call-back funtion showCategory
				$(category_list_id).append(li);
				
				// Add Non LBS categories to the locales menu
				if (index <= colale.constants.getNonLBSNumber())
					$(colale_locales_NonLBS_categories).append(li.clone());
				
				//if (index == colale.constants.getNonLBSNumber()) {
				if (index == colale.constants.getNonLBSNumber()) {
					$(category_list_id).append('<hr style="height:3px; background-color:#ccc; border:0; margin-top:12px; margin-bottom:12px;"/>');
					$(colale_locales_NonLBS_categories).append('<hr style="height:3px; background-color:#ccc; border:0; margin-top:12px; margin-bottom:12px;"/>');
				}
				index++;
			}
		}
		return {
			"init" : init
		};
	})();
	
	view.categoriesListLBS = (function () {
		var page_id = colale.lib.hash_symbol + "colale_select_flashcards";
		var category_list_id = "#colale_locales_LBS_categories";
		var pois_list_id = "#colale_locales_POIs_list";
		var template_element_class = ".colale-category-template-element:first";
		var li_with_heading_role = "[role='heading']";
		var regular_li = "[role!='heading']";
		
		function show(categories) {
			//var flashCards = model.getFlashCards();
			//$(category_list_id).find(template_element_class).hide();
			var li_template = $("#colale_locales_NonLBS_categories").
				find(template_element_class).clone();
			//$(li_template).show();
			$(category_list_id).empty();
			/*
			$(category_list_id).
			find(template_element_class).
			remove();
			*/
			//console.log("Template: " + li_template.html());
			//li_template.text("Mr Hallo");
			//var li2 = $(li_template).find(".ui-btn-text");
			//li2.text("Hallooooo!!!");


			//li_template.show();
			//li_template.removeAttr("style");
			
			//console.log("Cats2: " + JSON.stringify(categories));
			for (i=0; i<categories.length; i++) {
				var li = li_template.clone();
				var span = $(li).find(".ui-btn-text");
				//console.log("Templ: " + li.html());

				var category_idx = 1;
				for (var key in model.getFlashCards()) {
					if (key.localeCompare(categories[i]) == 0)
						break;
					category_idx++;
				}
				var langid = "cat" + category_idx.pad(2) + "00";
				span.attr("data-l10n-id", langid);
				//span.text(categories[i]);
				span.text(document.webL10n.get(langid));
				li.attr("href",
					"javascript:colale.control.showFlashcardList('" +
					categories[i] + "', '" + page_id +
					"')");
				// ensure that the value of cat is _copied_ to the context
				// of the call-back funtion showCategory
				$(category_list_id).append(li);
			}
			
			// Translate to current lang
			/*
			console.log("Trans1: " + $(category_list_id).html());
			document.webL10n.translate2(colale.model.getSetting(category_list_id), 
				document.getElementById("colale-category-list"));
			console.log("Trans2: " + $(category_list_id).html());
			*/
			//console.log("Element: " + $(category_list_id).html());
			//console.log("Element2: " + $("#colale_locales").html());
		}
		
		function showPOIs(pois) {
			$(pois_list_id).empty();

			for (i=0; i<pois.length; i++) {
				$(pois_list_id).append("<p><b>" + pois[i] + "</b></p>");
			}
			
			//console.log("Element: " + $(category_list_id).html());
			//console.log("Element2: " + $("#colale_locales").html());
		}
		return {
			"show" : show,
			"showPOIs" : showPOIs,
		};

	})();
	
	view.flashcardsList = (function () {
	//model.setUserPoiCategories({});
		var page_id = colale.lib.hash_symbol + "colale_select_flashcards";
		var flashcard_list_id = "#colale-flashcard-list";
		var flashcard_list_id_helper = "#colale-flashcard-list-helper";
		var template_element_class = ".colale-template-element-helper";
		var heading_template_element_class = ".colale-template-element-heading-helper";
		var li_with_heading_role = "[role='heading']";
		var regular_li = "[role!='heading']";
		var regular_li_heading = "[role='heading']";

		function init(category) {
			var flashCards = model.getFlashCards()[category]["entries"];
			console.log("Flashcards{" + category + "}: " + JSON.stringify(flashCards));
			
			var category_idx = 1;
			for (var key in model.getFlashCards()) {
				if (key.localeCompare(category) == 0)
					break;
				category_idx++;
			}
			
			var li_template = $(flashcard_list_id_helper).
				find(regular_li + ":first").clone();
			$(flashcard_list_id).
			find(regular_li).
			remove();
			
			var li_template_heading = $(flashcard_list_id_helper).
				find(regular_li_heading + ":first").clone();
			$(flashcard_list_id).
			find(regular_li_heading).
			remove();
			
			//console.log("Subcategory: " + li_template.clone().wrap('<p>').parent().html());
			// Add the category name to the first heading
			var li_heading_cat = li_template_heading.clone();
			//li_heading_cat.text(category);
			li_heading_cat.text("");
			var langid = "cat" + category_idx.pad(2) + "00";
			
			li_heading_cat.append("<span data-l10n-id=\"" + langid + "\">" + document.webL10n.get(langid) + "</span>");
			$(flashcard_list_id).append(li_heading_cat);
			
			for (var i = 0; i < flashCards.length; i++) {
//			for (var cat in flashCards) {
				//console.log("Flashcard item: " + JSON.stringify(flashCards[i]));
				if (flashCards[i]["type"].localeCompare("separator") == 0) {
					var li_heading = li_template_heading.clone();
					li_heading.removeClass("colale-template-element-heading");
					//li_heading.text(flashCards[i]["lang1"]);
					li_heading.text("");
					langid = "cat" + category_idx.pad(2) + "" + (i+1).pad(2);
					//li_heading.append("<span data-l10n-id=\"" + langid + "\">" + flashCards[i]["lang1"] + "</span>");
					li_heading.append("<span data-l10n-id=\"" + langid + "\">" + document.webL10n.get(langid) + "</span>");

					//console.log(li_heading.html());
					$(flashcard_list_id).append(li_heading);
				} else {
					var li = li_template.clone();
					var te = li.find(template_element_class);
					//te.removeClass("colale-template-element");
					//te.text(flashCards[i]["lang1"]);
					te.text("");
					langid = "cat" + category_idx.pad(2) + "" + (i+1).pad(2);
					te.append("<span data-l10n-id=\"" + langid + "\">" + document.webL10n.get(langid) + "</span>");
					te.attr("href",
						"javascript:colale.control.showFlashcard('" +
						category + "', " + i + ", '" + page_id +
						"')");
					//console.log("Attribute: " + te.attr("data-transition"));
					// ensure that the value of cat is _copied_ to the context
					// of the call-back funtion showCategory
					$(flashcard_list_id).append(li);
				}
			}
		}
		return {
			"init" : init
		};
	})();

	view.flashcard = (function () {
		var flashcard_id = colale.lib.hash_symbol + "colale_flashcard";
		var page_id = flashcard_id;
		var return_to_anchor_id = "#colale_flashcard_return_to";
		var progress_id = "#colale_flashcard_progress";
		var progress = "colale_flashcard_progress";
		var lang_start_id = "#colale_flashcard_lang_start";
		var lang_ziel_female_id = "#colale_flashcard_lang_ziel_female";
		var lang_ziel_male_id = "#colale_flashcard_lang_ziel_male";
		var lang_ziel_non_id = "#colale_flashcard_lang_ziel_non";
		var audio_ziel_id = "#colale_flashcard_audio_ziel";
		var lang_phonetic2_female_id = "#colale_flashcard_phonetic2_female";
		var lang_phonetic2_male_id = "#colale_flashcard_phonetic2_male";
		var lang_phonetic2_non_id = "#colale_flashcard_phonetic2_non";
		var header_id = "#colale_flashcard_header";
		var next_id = "#colale_flashcard_next";
		var prev_id = "#colale_flashcard_prev";
		var play_button = "#colale_flashcard_audio_ziel_play_button";
		var audio_file = null;
		var audio_player = null;
		var colale_flashcard_lang2_non = "#colale_flashcard_lang2_non_div";
		var colale_flashcard_lang2_male = "#colale_flashcard_lang2_male_div";
		var colale_flashcard_lang2_female = "#colale_flashcard_lang2_female_div";
		var colale_flashcard_phonetic2_non = "#colale_flashcard_phonetic2_non_div";
		var colale_flashcard_phonetic2_male = "#colale_flashcard_phonetic2_male_div";
		var colale_flashcard_phonetic2_female = "#colale_flashcard_phonetic2_female_div";
		
		function init(return_to_page_id) {
			console.log("flashcard.init");
			/*
			jQMProgressBar(progress)
			.setOuterTheme('c')
			.setInnerTheme('c')
			//                    .isMini(true)
			.setMax(100)
			//                    .setStartFrom(0)
			//                    .setInterval(50)
			.showCounter(false)
			.build();
			//                    .run();
			
			$(prev_id).click(function () {
				colale.control.showPrevFlashcard();
			});
			$(next_id).click(function () {
				console.log("Next... ");
				colale.control.showNextFlashcard();
			});
			*/
			$(play_button).click(function () {
				console.log("play " + audio_file);
				if (audio_file != null) {
					// OOSO: Does not play on device with Audio
					//var audio = new Audio(audio_file);
					var audio = new Media("file:///android_asset/www/" + audio_file, null, null);
					audio.play();
				}
			});
			function set_return_to_page(return_to_page_id) {
				// avoid cyclic link
				if (return_to_page_id == flashcard_id || return_to_page_id == "#colale_flashcard") {
					return;
				}
				console.log("set_return_to_page(" + return_to_page_id + ")");
				$(return_to_anchor_id).attr(
					"href",
					return_to_page_id);
			}
			set_return_to_page(return_to_page_id);
			view.flashcard.init = function (return_to_page_id) {
				//			console.log("flashcard.init: wiederholtes init");
				set_return_to_page(return_to_page_id);
			}
		}
		
		// Visibility: block-> show, none-> hide
		function changeVisibilityDivs(visibility, divs) {
			for (i=0; i<divs.length; i++) {
				visibility == 1 ? $(divs[i]).show() : $(divs[i]).hide();
				//visibility == 1 ? $(divs[i]).css('visibility', 'visible') : $(divs[i]).css('visibility', 'hidden');
				//var e = document.getElementById(divs[i]);
				//e.style.display = visibility;
			}
		}
		function show(category, index) {
			var flashCards = model.getFlashCards()[category];

			if (lib.isInvalid(category)) {
				throw "colale.view.flashcard.init: Illegal Argument category: '" + category + "'.";
			}
			if (index < 0 || index >= flashCards.length) {
				throw "colale.view.flashcard.init: Illegal Argument index: '" + index + "'.";
			}

			//		console.log("colale.view.flashcard.init("+category+","+index+")");
/*
			$(header_id).text(category);

			jQMProgressBar(progress)
			.setValue(Math.round((index + 1) / flashCards.length * 100));
*/
			var entry = flashCards["entries"][index];
			//		console.log("lang_start: "+entry[model.flashcards_header.lang_start]);
			//		console.log("lang_ziel: "+entry[model.flashcards_header.lang_ziel]);
			$(lang_start_id).text(entry[model.flashcards_header.lang1]);
			
			var gender = colale.model.getSetting("#colale_settings_gender");
			var lang = entry[model.flashcards_header.lang2].split("/");
			var phonetic = entry[model.flashcards_header.phonetic2].split("/");
			var femaleLang = "", femalePhonetic = "";
			var maleLang = "", malePhonetic = "";
			
			//changeVisibilityDivs(0, [lang_ziel_female_id, lang_ziel_male_id, lang_ziel_non_id, lang_phonetic2_female_id, lang_phonetic2_male_id, lang_phonetic2_non_id]); 
			changeVisibilityDivs(0, [colale_flashcard_lang2_non, colale_flashcard_lang2_male, colale_flashcard_lang2_female, colale_flashcard_phonetic2_non, colale_flashcard_phonetic2_male, colale_flashcard_phonetic2_female]);
			if (lang.length == 1) {
				// Nothing to do, show as is
				$(lang_ziel_non_id).text(lang[0]);
				$(lang_phonetic2_non_id).text(phonetic[0]);
				
				//changeVisibilityDivs(1, [lang_ziel_non_id, lang_phonetic2_non_id]); 
				changeVisibilityDivs(1, [colale_flashcard_lang2_non, colale_flashcard_phonetic2_non]);
			} else if (lang.length == 2) {
				if (gender == null || gender.localeCompare("both") == 0) {
					femaleLang = "Frau: " + lang[0];
					maleLang = "Mann: " + lang[1];
					femalePhonetic = "Frau: " + phonetic[0];
					malePhonetic = "Mann: " + phonetic[1];
					
					//changeVisibilityDivs(1, [lang_ziel_female_id, lang_ziel_male_id, lang_phonetic2_female_id, lang_phonetic2_male_id]); 
					changeVisibilityDivs(1, [colale_flashcard_lang2_male, colale_flashcard_lang2_female, colale_flashcard_phonetic2_male, colale_flashcard_phonetic2_female]);
			} else if (gender.localeCompare("woman") == 0) {
					femaleLang = "Frau: " + lang[0];
					femalePhonetic = "Frau: " + phonetic[0];
					
					//changeVisibilityDivs(1, [lang_ziel_female_id, lang_phonetic2_female_id]); 
					changeVisibilityDivs(1, [colale_flashcard_lang2_female, colale_flashcard_phonetic2_female]);
				} else if (gender.localeCompare("man") == 0) { 
					maleLang = "Mann: " + lang[1];
					malePhonetic = "Mann: " + phonetic[1];
					
					//changeVisibilityDivs(1, [lang_ziel_male_id, lang_phonetic2_male_id]);
					changeVisibilityDivs(1, [colale_flashcard_lang2_male, colale_flashcard_phonetic2_male]);
				} else {
				}
			} else {
				// Something wrong with the input!
			}
			
			$(lang_ziel_female_id).text(femaleLang);
			$(lang_ziel_male_id).text(maleLang);
			$(lang_phonetic2_female_id).text(femalePhonetic);
			$(lang_phonetic2_male_id).text(malePhonetic);
			
			function getNextLang(lang) {
				return lang.localeCompare("de") == 0 ? "TH" : "DE";
			}

			//		$(audio_ziel_id).attr("src","audio/"+entry[colale.header.audio_ziel]);
			audio_file = "audio/" + entry[model.flashcards_header.audio2] + "_" + 
				getNextLang(colale.model.getSetting("#colale_settings_language")) + 
				"." +
				colale.constants.getAudioFileFormat();
			//		console.log("play "+audio_file);
			//$(audio_ziel_id).parent().load();

			if (index >= flashCards.length - 1) {
				$(next_id).css("visibility", "hidden");
			} else {
				$(next_id).css("visibility", "visible")
			}
			if (index == 0) {
				$(prev_id).css("visibility", "hidden");
			} else {
				$(prev_id).css("visibility", "visible")
			}
		}
		return {
			"init" : init,
			"show" : show
		};
	})();

	view.Progressbar = (function () {
		function Progressbar(div_id) {
			/* bind progressbar to div with id div_id */
			this.div = div_id;
			this.active = 0;
			this.pbar = null;
		}
		Progressbar.prototype.activate = function () {
			if (this.active > 0) {
				this.active++;
			} else {
				this.pbar = jQMProgressBar(this.div)
					.setOuterTheme('b')
					.isIndefinite(true)
					.isMini(true)
					.showCounter(false)
					.build();
					
			}
		}
		Progressbar.prototype.deactivate = function () {
			if (this.active > 0) {
				this.active--;
			}
			if (this.active == 0) {
				this.pbar.destroy();
				this.pbar = null;
			}
		}
		return Progressbar;
	})();

	function showGefundeneLernorte(poilist) {
		console.log("showGefundeneLernorte");
		//	var poilist=model.getPOIList();
		//	var poilist=poilist || [
		//		{cat: "Lernort1", dist: 10},
		//		{cat: "Lernort2", dist: 10},
		//		{cat: "Lernort3", dist: 10}
		//	];
		if (poilist == null) {
			return;
		}
		var cats = {};
		var ctr = 0;
		for (var i = 0; i < poilist.length; i++) {
			var pl_entry = poilist[i];
			var new_cat = pl_entry.cat;
			if (cats[new_cat] == undefined) {
				cats[new_cat] = new_cat;
				ctr++;
				var class_id = ".lernort" + ctr;
				$(class_id).text(
					pl_entry.cat
					 + " (" + pl_entry.dist + "m)");
				$(class_id).attr("href",
					"javascript:colale.control.showPOI('" + pl_entry.cat + "')");
				//			console.log(class_id+": "+
				//				pl_entry.cat
				//				+ " ("+pl_entry.dist+"m)");
				if (ctr == 3) {
					break;
				}
			}
		}
		ctr++;
		for (; ctr <= 3; ctr++) {
			var class_id = ".lernort" + ctr;
			$(class_id).text("");
			//		console.log(class_id+": <leer>");
		}
		$(".gefundene_lernorte").trigger("create");
	}
	view.showGefundeneLernorte = showGefundeneLernorte;

	view.poisList = (function () {
		var page_id = colale.lib.hash_symbol + "colale_select_flashcards";
		var category_list_id = "#colale_settings_pois_results";
		var pois_list_id = "#colale_locales_POIs_list";
		var template_element_class = ".colale-category-template-element:first";
		var li_with_heading_role = "[role='heading']";
		var regular_li = "[role!='heading']";
		
		function show(categories) {
			var li_template = $("#colale_locales_NonLBS_categories").
				find(template_element_class).clone();
			$(category_list_id).empty();

			console.log("View pois..." + categories.length);
			for (i=0; i<categories.length; i++) {
				var li = li_template.clone();
				var span = $(li).find(".ui-btn-text");

				//span.attr("data-l10n-id", "cat" + category_idx.pad(2) + "00");
				span.text(categories[i].name + " (" + categories[i].dist + "m.)");
				//console.log("LINK: " + categories[i].name);
				li.attr("href",
					"javascript:colale.control.showPoiList(\"" +
					categories[i].name + "\", '" + categories[i].cat + "', '(" + categories[i].dist + "m.)" +
					"')");
				// ensure that the value of cat is _copied_ to the context
				// of the call-back funtion showCategory
				$(category_list_id).append(li);
			}
			
			var home_page=$("#colale_settings_pois");
			$.mobile.changePage(home_page);
		}
		
		return {
			"show" : show,
		};

	})();

	view.poisCategories = (function(){
		function show() {
			var currentPoiName = model.getCurrentPoiName();
			var currentCategory = model.getCurrentPoiCategory();
			var userPoiCategories = model.getUserPoiCategories();

			$("#currentPoiName").text(currentPoiName);
			//$("#currentPoiAddress").text(model.getCurrentPoiAddress() + " (" + model.getCurrentPoiDistance() + "m.)");
			$("#currentPoiAddress").text(model.getCurrentPoiAddress() + " " + model.getCurrentPoiDistance());
			
			
			// When htmlEscaping, this throws and error with # character
			//console.log("userPoiCategories: " + JSON.stringify(userPoiCategories));
			
			// FIX ME: What happen with different address but same name, e.g. Lidl nied/westend
			if (userPoiCategories != null && userPoiCategories.hasOwnProperty(currentPoiName)) {
				// Load saved values
				var categories = userPoiCategories[currentPoiName]["categories"];
				$("#categories_checkboxes input[type='checkbox']").each(function() {
					currentCategory = $(this).attr('name');
					$(this).prop('checked', categories[currentCategory]);
				});
				
			} else {
				// Reset all checkboxes
				//$("#categories_checkboxes input[type='checkbox']").attr('checked', false).checkboxradio('refresh');
				$("#categories_checkboxes input[type='checkbox']").each(function() {
					if ($(this).attr('name') == currentCategory) {
						$(this).prop('checked', true);
					} else {
						$(this).prop('checked', false);
					}
					
					//$(this).checkboxradio('refresh');
					//console.log($(this).attr('name') + "," + $(this).attr('checked'));
					//console.log("Button: " + $(this).parent().find(".ui-btn-text").text());
				});
			}
			
			var page = $("#colale_settings_pois_results_content");
			$.mobile.changePage(page);
		}

		return {
			"show" : show,
		};
	})();
	
	view.userPoisList = (function () {
		var page_id = colale.lib.hash_symbol + "colale_settings_user_pois";
		var flashcard_list_id = "#colale_settings_user_pois_list";
		var flashcard_list_id_helper = "#colale-flashcard-list-helper";
		var template_element_class = ".colale-template-element-helper";
		var heading_template_element_class = ".colale-template-element-heading-helper";
		var li_with_heading_role = "[role='heading']";
		var regular_li = "[role!='heading']";
		var regular_li_heading = "[role='heading']";

		function show(category) {
			var userPoiCategories = model.getUserPoiCategories();

			//var flashCards = model.getFlashCards()[category]["entries"];
			//console.log("userPois: " + JSON.stringify(userPoiCategories));
						
			var li_template = $(flashcard_list_id_helper).
				find(regular_li + ":first").clone();
				
			var li_template_heading = $(flashcard_list_id_helper).
				find(regular_li_heading + ":first").clone();

			$(flashcard_list_id).empty();
			
			var li_heading_cat = li_template_heading.clone();
			li_heading_cat.text("");
			li_heading_cat.append("<span data-l10n-id=\"Label12\">" + document.webL10n.get("Label12") + "</span>");
			$(flashcard_list_id).append(li_heading_cat);
				
			for (var key in userPoiCategories) {
				if (userPoiCategories.hasOwnProperty(key)) {
					var li = li_template.clone();
					var te = li.find(template_element_class);
					//te.removeClass("colale-template-element");
					//te.text(flashCards[i]["lang1"]);
					te.text(key);
//					te.append("<span data-l10n-id=\"cat" + category_idx.pad(2) + "" + (i+1).pad(2) + "\">" + flashCards[i]["lang1"] + "</span>");
					te.attr("href",
							"javascript:colale.control.showPoiList(\"" +
							key + "\", '', '" + 
							"')");
					$(flashcard_list_id).append(li);
				}
			}
			
			var page = $("#colale_settings_user_pois");
			$.mobile.changePage(page);
		}
		return {
			"show" : show
		};
	})();

	
	function init(success, error) {
		console.log("view.init ...");
		view.categoriesList.init();
		//view.flashcardsList.init();
		view.assignFlashCards.init();
		/*
		// OOSO: Not needed by the moment

		$("[data-role='page']").on("pagecreate",function(event) {
		function lernortItem(lernort) {
		//			console.log("lernort: "+lernort);
		var item=
		'<li style="height: 48px;">'+
		'<a style="height: 48px;" class="'+lernort+'">'+
		'</a>'+
		'</li>';
		//			console.log("item: "+item);
		return item;
		}
		var footer=
		'<div data-theme="a" data-role="footer" data-position="fixed">'+
		'<div data-role="navbar">'+
		'<ul>'+
		lernortItem("lernort1")+
		lernortItem("lernort2")+
		lernortItem("lernort3")+
		'</ul>'+
		'</div>'+
		'</div>';
		//		console.log("footer: "+footer);
		//		console.log("event.target.nodeName: "+event.target.nodeName);
		$(event.target).append(footer);
		showGefundeneLernorte(model.getPOIList());
		});
		 */

		success();
	}
	view.init = init;

	view.splashscreen_pbar = new view.Progressbar('splash-screen-progressbar');

	//console.log("view: "+JSON.stringify(view));

	return view;
})();