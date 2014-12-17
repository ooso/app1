// CoLaLe configuration
var colale={};
colale.constants = (function(){
	console.log("init colale.constants");

	var COLALE_LBS_RADIUS = 1000; // 100mts by default
	var COLALE_LBS_REFRESH_TIME = 60000; // 60000ms by default
	var COLALE_CURRENT_LANG = "de"; // Deutchsland by default
	var COLALE_LBS_REFRESH_DISTANCE = -1; // 5m by default
	
	var COLALE_LBS_FILTER = "on";
	var COLALE_NON_LBS_NUMBER = 3; // Fix me!, Hardcoded value
	var COLALE_AUDIO_FILE_FORMAT = "mp3";
	
	var COLALE_CURRENT_GENDER = "both"; // Both by default
	
	// We need to move here all the hardcoded values!!!
	
	function init(success, error) {
		console.log("constants.init ...");
	}

	function setRadius(radius) {
		// Save to storage?
	}
	
	function getRadius() {
		return COLALE_LBS_RADIUS;
	}
	
	function getNonLBSNumber() {
		return COLALE_NON_LBS_NUMBER;
	}
	
	function getCurrentLang() {
		return COLALE_CURRENT_LANG;
	}
	
	function getAudioFileFormat() {
		return COLALE_AUDIO_FILE_FORMAT;
	}
	
	function getCurrentGender() {
		return COLALE_CURRENT_GENDER;
	}
	
	function getRefreshTime() {
		return COLALE_LBS_REFRESH_TIME;
	}
	
	function getRefreshDistance() {
		return COLALE_LBS_REFRESH_DISTANCE;
	}
	
	function getLBSFilter() {
		return COLALE_LBS_FILTER;
	}
	
	
	return {
		"init": init,
		"setRadius": setRadius,
		"getRadius": getRadius,
		"getNonLBSNumber" : getNonLBSNumber,
		"getCurrentLang" : getCurrentLang,
		"getAudioFileFormat" : getAudioFileFormat,
		"getCurrentGender" : getCurrentGender,
		"getRefreshDistance" : getRefreshDistance,
		"getRefreshTime" : getRefreshTime,
		"getLBSFilter" : getLBSFilter,
	};

})();
