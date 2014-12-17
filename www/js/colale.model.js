colale.model = (function(){
console.log("init colale.model");

var lib=colale.lib;

/* old
var flashcards_header = {
	lang_start: "lang_start",
	lang_ziel: "lang_ziel",
	audio_start: "audio_start",
	audio_ziel: "audio_ziel",
	category: "category"
};
*/

var flashcards_header = {
	type: "type",
	lang1: "lang1",
	lang2: "lang2",
	phonetic2: "phonetic2",
	audio2: "audio2",
	category: "category"
};

/*
 * Verknuepfung Layout<->Funktionalitaet:
 * #colale-category-list: Auswahlliste mit den Kategorien
 *    1. li muss role="heading" haben.
 *    2. li wird als Muster fuer die Eintraege genommen.
 *       Das darin enthaltene Element mit class="colale-template-element"
 *    3... li werden geloescht.
 */

var storage={
	put: function(key,val) {
		localStorage.setItem(key, JSON.stringify(val));
//		console.log("storage.put("+key+","+JSON.stringify(val)+")");
//		console.log("storage check: "+localStorage.getItem(key));
	},
	get: function(key) {
		var val=localStorage.getItem(key);
		if (val==null || val==undefined) {return null;}
		return JSON.parse(val);
	}
};

function getPOIList() {
	return storage.get("POIList");
}
function setPOIList(poiList) {
	storage.put("POIList", poiList);
}

function getPOIAssignment() {
	return storage.get("POIAssignment");
}
function setPOIAssignment(poiAssignment) {
	storage.put("POIAssignment", poiAssignment);
}

function setLongitude(lon) {storage.put("longitude",lon);}
function setLatitude(lat) {storage.put("latitude",lat);}
function getLongitude() {return storage.get("longitude");}
function getLatitude() {return storage.get("latitude");}

function getPOIMap() {return storage.get("poiMap");}
function setPOIMap(poiMap) {storage.put("poiMap",poiMap);}
function getPOICategories() {return storage.get("poiCategories");}
function setPOICategories(poiCategories) {
	return storage.put("poiCategories",poiCategories);
}
function getFlashCards() {return storage.get("flashCards");}
function setFlashCards(flashCards) {
	return storage.put("flashCards", flashCards);
}
function setCurrentFlashCard(category,index) {
	storage.put("currentFlashCard",{
		"category": category,
		"index": index
	});
}
function getCurrentFlashCard() {
	return storage.get("currentFlashCard");
}

function setCurrentCategory(category) {
	storage.put("currentCategory", category);
}
function getCurrentCategory() {
	return storage.get("currentCategory");
}



function init_flashCards(success,error) {
	console.log("model.init_flashCards ...");
	/* Has local storage already been initialized? */
	/* always reload flash cards config file */
	var flashCardsRaw=null; // getFlashCards();
	if (flashCardsRaw==null) {
		/* Initialize model. */
//		console.log("model.init: read flash cards from xml");
		$.get('./config/flash-cards.xml',
			function(xml){
				var table=lib.excelXML2Table(xml);
				var flashCardsRaw=lib.table2DictEntries(table, flashcards_header, flashcards_header["category"]);
// This produces the following data structure:
//
// (1) FlashCards :: string -> Category
// FlashCards is a map which maps the names of categories to the corresponding category object.
// (2) Category :: [Entry]
// A Category contains a list (an array) with all the
// Entry objects for the corresponding category.
// (3) Entry :: "type" | "lang1" |"lang2" | "phonetic1" | "audio_ziel" | "category" -> string
// An Entry object is a map which maps keys to strings.
// Semantics of the keys:
// - "type":
//		Entry["type"] == "title": title entry for the whole category
//		(flash-cards.xlsx: contains "Lektion" in first cell)
//		Entry["type"] == "separator": separator entry (sub-headlines)
//		(flash-cards.xlsx: contains "separator" in first cell)
//		Entry["type"] == "flashcard": flashcard entry
//		(flash-cards.xlsx: contains decimal digit as first character, e.g. "0_1", in first cell)
// - "lang1": flashcard entry in start language
// - "lang2": flashcard entry in target language
// - "audio2": name of audio file for flashcard entry in target langauge
// - "phonetic2": phonetic string for flashcard entry in target langauge
// - "category": name of the category

// This data structure has to be transformed to:
// (1) FlashCards :: string -> Category
// FlashCards is a map which maps the names of categories to the corresponding category object.
// (2) Category :: "title" -> Entry | "entries" -> [Entry]
// A Category contains an Entry object for the title of the category and
// a list (array) of Entry objects for the actual flashcards and the sub-headlines.
// (3) Entry :: "type" | "lang1" |"lang2" | "phonetic1" | "audio_ziel" | "category" -> string
// An Entry object is a map which maps keys to strings.
// Semantics of the keys:
// - "type":
//		Entry["type"] == "title": title entry for the whole category
//		(flash-cards.xlsx: contains "Lektion" in first cell)
//		Entry["type"] == "separator": separator entry (sub-headlines)
//		(flash-cards.xlsx: contains "separator" in first cell)
//		Entry["type"] == "flashcard": flashcard entry
//		(flash-cards.xlsx: contains decimal digit as first character, e.g. "0_1", in first cell)
// - "lang1": flashcard entry in start language
// - "lang2": flashcard entry in target language
// - "audio2": name of audio file for flashcard entry in target langauge
// - "phonetic2": phonetic string for flashcard entry in target langauge
// - "category": name of the category
	
	var flashCards={};
	for (var cat in flashCardsRaw.result) {
		var categoryRaw=flashCardsRaw.result[cat];
		var category= {
			"title": {},
			"entries": []
		};
		var entries=category["entries"];
		for (var i=0; i<categoryRaw.length; i++) {
			var entry=categoryRaw[i];
			if (entry[flashcards_header["type"]]=="category") {
				category["title"]=entry;
			} else {
				entries[entries.length]=entry;
			}
		}
		flashCards[cat]=category;
	}

//				console.log("model.init: store flash cards in local storage");
//				setFlashCards(flashCards.result);
				setFlashCards(flashCards);
				if (flashCardsRaw.errors.length>0) {
					var warning="./config/flash-cards.xml:\n";
					for (var i=0; i<flashCardsRaw.errors.length; i++) {
						warning=warning+flashCardsRaw.errors[i];
						if (i<flashCardsRaw.errors.length-1) {
							warning=warning+"\n";
						}
					}
					alert(warning);
				}
				success();
			}
		);
	} else {
		success();
	}
}

function init_poiMap(success, error) {
	console.log("model.init_poiMap ...");
	/* Has local storage already been initialized? */
	/* always reload poiMap config file */
	var poiMap = null; // model.getPOIMap();
	var poiCategories=null;
	if (poiMap == null || poiCategories==null) {
		/* Initialize model. */
		$.get('./config/poi-categories.xml', function(xml) {
			var table = lib.excelXML2Table(xml);
			var poiCategoriesMap = lib.table2DictEntries(
					table,
					{
						"category" : "category",
						"key" : "key",
						"value" : "value"
					},
					"category"
			);
			poiMap={};
			poiCategories=[];
//				console.log("poiCategories.result: "+JSON.stringify(poiCategories.result));
			for (cat in poiCategoriesMap.result) {
				if (cat=="") {continue;}
				poiCategories[poiCategories.length]=cat;
				pairs=poiCategoriesMap.result[cat];
				for (var i=0; i<pairs.length; i++) {
					var key=pairs[i].key;
					var value=pairs[i].value;
//					console.log("cat: "+cat+", key: "+key+", value: "+value);
					poiMap[key]=poiMap[key] || {};
					(poiMap[key])[value]=cat;
//					console.log("poiMap["+key+"]["+value+"]: "+poiMap[key][value]);
				}
			}
			poiCategories.sort();
			setPOIMap(poiMap);
			setPOICategories(poiCategories);
//			console.log("poiMap: "+JSON.stringify(poiMap));
//			console.log("poiCategories: "+JSON.stringify(poiCategories));
			if (poiCategoriesMap.errors.length > 0) {
				var warning = "./config/poi-categories.xml:\n";
				for (var i = 0; i < poiCategoriesMap.errors.length; i++) {
					warning = warning + poiCategoriesMap.errors[i];
					if (i < poiCategoriesMap.errors.length - 1) {
						warning = warning + "\n";
					}
				}
				alert(warning);
			}
			success();
		});
	} else {
		success();
	}
}

/*
// OOSO: CoLaLe Settings
var COLALE_LBS_RADIUS = 100; // 100mts by default
var COLALE_LBS_REFRESH_TIME = 30000; // 30000ms by default

function setRadius(radius) {
	storage.put("OSMRadius", radius);
}

function getRadius() {
	var current_radius = storage.get("#colale_settings_radius");
	
	// If does not exists, put defaults
	if (current_radius == null) {
		storage.put("#colale_settings_radius", COLALE_LBS_RADIUS);
		current_radius = COLALE_LBS_RADIUS;
	}
	
	return current_radius;
}
*/
function setSetting(key, value) {
	return storage.put(key, value);
}

function getSetting(key) {
	var value = storage.get(key);
	if (key.localeCompare("#colale_settings_language") == 0) {
		value = value == null ? colale.constants.getCurrentLang() : value;
	} else if (key.localeCompare("#colale_settings_gender") == 0) {
		value = value == null ? colale.constants.getCurrentGender() : value;
	} else if (key.localeCompare("#colale_settings_gps") == 0) {
		value = value == null ? colale.constants.getRefreshTime() : value;
	} else if (key.localeCompare("#colale_settings_location") == 0) {
		value = value == null ? colale.constants.getLBSFilter() : value;
	} else if (key.localeCompare("#colale_settings_radius") == 0) {
		value = value == null ? colale.constants.getRadius() : value;
	}
	
	return value;
}

function setLastPageTranslated(page) {
	storage.put("last_page_translated", page);
}

function getLastPageTranslated() {
	return storage.get("last_page_translated");
}

function setLastLangTranslated(lang) {
	storage.put("last_lang_translated", lang);
}

function getLastLangTranslated() {
	return storage.get("last_lang_translated");
}

function setCurrentPoiName(poiName) {
	storage.put("currentPoiName", poiName);
}

function getCurrentPoiName() {
	return storage.get("currentPoiName");
}

function setCurrentPoiCategory(poiCategory) {
	storage.put("currentPoiCategory", poiCategory);
}

function getCurrentPoiCategory() {
	return storage.get("currentPoiCategory");
}

function setCurrentPoiDistance(poiDist) {
	storage.put("currentPoiDistance", poiDist);
}

function getCurrentPoiDistance() {
	return storage.get("currentPoiDistance");
}

function setCurrentPoiAddress(poiAddress) {
	storage.put("currentPoiAddress", poiAddress);
}

function getCurrentPoiAddress() {
	return storage.get("currentPoiAddress");
}

function setUserPoiCategories(poiUser) {
	storage.put("userPoiCategories", poiUser);
}

function getUserPoiCategories() {
	return storage.get("userPoiCategories");
}

function init(success, error) {
		console.log("model.init ...");
		init_flashCards(
			function() {init_poiMap(success, error);},
			error
	);
}

return {
	"flashcards_header": flashcards_header,
	"getPOIList": getPOIList,
	"setPOIList": setPOIList,
	"getPOIMap": getPOIMap,
	"setPOIMap": setPOIMap,
	"getPOICategories": getPOICategories,
	"setPOICategories": setPOICategories,
	"getFlashCards": getFlashCards,
	"setFlashCards": setFlashCards,
	"setCurrentFlashCard": setCurrentFlashCard,
	"getCurrentFlashCard": getCurrentFlashCard,
	"setLongitude": setLongitude,
	"getLongitude": getLongitude,
	"setLatitude": setLatitude,
	"getLatitude": getLatitude,
	"init": init,
	
	// OOSO
	"setCurrentCategory" : setCurrentCategory,
	"getCurrentCategory" : getCurrentCategory,
	"setSetting" : setSetting,
	"getSetting" : getSetting,
	"setLastPageTranslated" : setLastPageTranslated,
	"getLastPageTranslated" : getLastPageTranslated,
	"setLastLangTranslated" : setLastLangTranslated,
	"getLastLangTranslated" : getLastLangTranslated,
	"setCurrentPoiName" : setCurrentPoiName,
	"getCurrentPoiName" : getCurrentPoiName,
	"setCurrentPoiCategory" : setCurrentPoiCategory,
	"getCurrentPoiCategory" : getCurrentPoiCategory,
	"setCurrentPoiDistance" : setCurrentPoiDistance,
	"getCurrentPoiDistance" : getCurrentPoiDistance,
	"setCurrentPoiAddress" : setCurrentPoiAddress,
	"getCurrentPoiAddress" : getCurrentPoiAddress,
	"setUserPoiCategories" : setUserPoiCategories,
	"getUserPoiCategories" : getUserPoiCategories,
};

})();
