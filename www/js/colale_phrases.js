// Var used to allow Lokales to request OSM data for the very first time
var colaleRuns = 0;

$(
	function() {			
		console.log("start ...");
		colale.view.splashscreen_pbar.activate();
		colale.control.init(
			function() { // success
				console.log("Initialization of Colale: successful.");
				colale.view.splashscreen_pbar.deactivate();
				//var home_page=$("#colale_select_flashcards");
				//var home_page=$("#colale_locales");
				//$.mobile.changePage(home_page);
				
				// Initial launch of Lokales, then a configured period of time
				//colale.control.showColaleLokales();
				//setInterval(colale.control.showColaleLokales, colale.model.getSetting("#colale_settings_gps")*1000);
				
				//console.log("getPOICategories: "+JSON.stringify(colale.model.getPOICategories()));
				//console.log("getFlashCards: "+JSON.stringify(colale.model.getFlashCards()));
			},
			function() {
				colale.view.splashscreen_pbar.deactivate();
				throw "Initialization of Colale: failed."
			} // error
		);
	}
);

