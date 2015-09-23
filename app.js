var years = [];
var timeSeriesData = {};
var categories = [];
var charttitle = "";
var question = "";
var chart = {};
var options = {};
var userkey = "611feeba3f2cb5a8d76956e580969ebf";

var app = angular.module('euquality', [
  'ngRoute',
  'ngResource',
  'mobile-angular-ui',
  'mobile-angular-ui.gestures'
]);

app.config(function($routeProvider) {
  $routeProvider.when('/',              {templateUrl: 'home.html', reloadOnSearch: false}); 
  $routeProvider.when('/query',         {templateUrl: 'query.html', reloadOnSearch: false});
  $routeProvider.when('/about',         {templateUrl: 'about.html', reloadOnSearch: false});
});

app.controller('QueryController', function($rootScope, $scope, $location) {
	
	var country = $.parseJSON(window.localStorage.getItem("country"));
	
	var query = {};
	query = {"id" : $location.search()['id'],"name" : $location.search()['name']};
	$scope.query = query;
	$scope.country = country;
	
	 $.ajax({
			url : "https://api.ukdataservice.ac.uk/V1/datasets/EQLS/topics/" + query.id + "/variables",
			data : {"user_key" : userkey},
			async : false,
			success : function(data) {
				var variables = [];
				for(var i = 0;i < data.Variables.length;i++) {
					var variable = {};
					variable = {"id" : data.Variables[i].VariableId, 
							   "name" : data.Variables[i].VariableLabel};
					if(i == 0) {
						$scope.variableId = data.Variables[i].VariableId;
					}
					variables.push(variable);
				}
				$scope.variables = variables.sort(function(a, b) {
					if(a.name > b.name) {
						return 1;
					} else if(a.value < b.name) {
						return -1;
					} else {
						return 0;
					}
				});
			}
	  });
	 
	 $scope.changeCountry = function(countryIdAndName) {
		 var parts = countryIdAndName.split(":");
		 var country = {"id":parts[0],"name":parts[1]};
		 window.localStorage.setItem("country", JSON.stringify(country));
		 $scope.displayReport(window.localStorage.getItem("variableId"), window.localStorage.getItem("year"));
	 };
	 
	 $scope.displayReport = function(id, selectedYear) { 
		 
		 if(selectedYear == undefined) {
			 selectedYear = window.localStorage.getItem("year");
		 } 
		 
		 if(selectedYear == undefined) {
			 selectedYear = "2011";
		 }
		 
		 var country = $.parseJSON(window.localStorage.getItem("country"));
		 
		 categories = [];
		 years = [];
		 
		 $.ajax({
				url : "https://api.ukdataservice.ac.uk/V1/datasets/EQLS/variables/" + id,
				data : {"user_key" : userkey},
				async : false,
				success : function(data) {
					charttitle = data.Variable.VariableLabel;
					question = data.Variable.Question;
					for(var i = 0;i < data.Variable.Categories.length;i++) {
						var category = {};
						category = {
								"id" : data.Variable.Categories[i].CategoryId, 
								"label" : data.Variable.Categories[i].CategoryLabel,
								"value" : data.Variable.Categories[i].CategoryValue
						};	
						categories.push(category);
					}
				}
		 });
		 
		 var chartData = [];
		 chartData.push(["category", "weight"]);
		 
		 var year = "";
		 
		 $.ajax({
				url : "https://api.ukdataservice.ac.uk/V1/datasets/EQLS/TimeseriesFrequency",
				data : {"user_key" : userkey,
					    "variableId" : id,
					    "filter" : "2:" + country.id},
				async : false,
				success : function(data) {
					timeSeriesData = data;
					for(var i = 0;i < data.TimeSeries.length;i++) {
						if(year == "" || year != data.TimeSeries[i].Year) {
							year = data.TimeSeries[i].Year;
							years.push(year);
							chartData = [];
							chartData.push(["category", "weight"]);
							for(var j = 0;j < data.TimeSeries.length;j++) {
								if(data.TimeSeries[j].Year == selectedYear) {
									for(var k = 0;k < categories.length;k++) {
										if(categories[k].value == data.TimeSeries[j].Value) {
											chartData.push([categories[k].label,
													data.TimeSeries[j].WeightedFrequency]);
										}
									}
									
								}
							}
						}
					}
				}
		 });

		 document.getElementById("container").innerHTML = "";
		 var descriptionDiv = document.createElement("div");
		 descriptionDiv.setAttribute("id","descriptionDiv");
		 descriptionDiv.innerHTML = question.replace("[COUNTRY]", country.name);
		 descriptionDiv.setAttribute("style","padding-bottom: 10px;padding-top: 10px;");
		 var buttonsDiv = document.createElement("div");
		 buttonsDiv.setAttribute("id","yearButtonsGroup");
		 buttonsDiv.setAttribute("class","btn-group");
		 buttonsDiv.setAttribute("style","padding-bottom: 10px;");
		 
		 var chartDiv = document.createElement("div");
		 chartDiv.setAttribute("id","chart");
		 
		 for(var i = 0;i < years.length;i++) {
			 var yearButton = document.createElement("button");
			 if(selectedYear == years[i]) {
				 yearButton.setAttribute("class","btn btn-primary");
			 } else {
				 yearButton.setAttribute("class","btn");
			 }
			 yearButton.setAttribute("id","btn" + years[i]);
			 yearButton.setAttribute("onclick", "switchYear(" + years[i] + ")");
			 yearButton.appendChild(document.createTextNode(years[i]));
			 buttonsDiv.appendChild(yearButton);
		 }
		 
		 document.getElementById("container").appendChild(descriptionDiv);
		 document.getElementById("container").appendChild(buttonsDiv);
		 document.getElementById("container").appendChild(chartDiv);
		 
		 var data = google.visualization
		 	.arrayToDataTable(chartData);

	    options = {
	       "title" : charttitle
	    };
		    
		chart = new google.visualization.PieChart(document.getElementById("chart"));

		chart.draw(data, options);
		
		window.localStorage.setItem("variableId", id);
		window.localStorage.setItem("year", selectedYear);
		
	 };
	 
	 $scope.displayReport($scope.variableId);
});

function comparator(a, b) {
    if (a[1] === b[1]) {
        return 0;
    } else {
        return (a[1] < b[1]) ? -1 : 1;
    }
}

function switchYear(year) {
	for(var i = 0;i < years.length;i++) {
		var button = document.getElementById("btn" + years[i]);
		if(year == years[i]) {
			window.localStorage.setItem("year", year);
			button.setAttribute("class","btn btn-primary");
		} else {
			button.setAttribute("class","btn");
		}	
	} 
	
	for(var i = 0;i < timeSeriesData.TimeSeries.length;i++) {
		if(year == timeSeriesData.TimeSeries[i].Year) {
			chartData = [];
			chartData.push(["category", "weight"]);
			for(var j = 0;j < timeSeriesData.TimeSeries.length;j++) {
				if(timeSeriesData.TimeSeries[j].Year == year) {
					for(var k = 0;k < categories.length;k++) {
						if(categories[k].value == timeSeriesData.TimeSeries[j].Value) {
							chartData.push([categories[k].label,
							                timeSeriesData.TimeSeries[j].WeightedFrequency]);
						}
					}
					
				}
			}
		}
	}
	
	var data = google.visualization.arrayToDataTable(chartData);
	
	chart.draw(data, options);
	
}

app.controller('MainController', function($rootScope, $scope, $location) {	
	
  // User agent displayed in home page
  $scope.userAgent = navigator.userAgent;

  var country = {};
  var countryName = "Finland";
  
  $scope.changeCountry = function(country) {
	  window.localStorage.setItem("country", JSON.stringify(country));
	  window.location = "index.html";
  };
  
  if(window.localStorage.getItem("country") == undefined) {
	  //http://www.markuskarjalainen.com/rest/geo/country/?apikey=dXYtdHJhY2tlci1pZA==&q=59.437216,24.745369
	  // TODO : Resolve country using GPS
  } else {
	  country = $.parseJSON(window.localStorage.getItem("country"));
	  countryName = country.name;
  }
    
  $scope.country = countryName;

  $rootScope.$on('$routeChangeStart', function(){
    $rootScope.loading = true;
  });

  $rootScope.$on('$routeChangeSuccess', function(){
    $rootScope.loading = false;
  });
  
  $.ajax({
		url : "https://api.ukdataservice.ac.uk/V1/datasets/EQLS/variables/2",
		data : {"user_key" : userkey},
		async : false,
		success : function(data) {
			var countries = [];
			for(var i = 0;i < data.Variable.Categories.length;i++) {
				var country = {};
				country = {"id" : data.Variable.Categories[i].CategoryId, 
						 "value" : data.Variable.Categories[i].CategoryValue,
						 "name" : data.Variable.Categories[i].CategoryLabel};
				
				if(countryName.toUpperCase() == country.name.toUpperCase()) {
					window.localStorage.setItem("country", JSON.stringify(country));
				}
				
				countries.push(country);
			}
			$scope.countries = countries.sort(function(a, b) {
				if(a.name > b.name) {
					return 1;
				} else if(a.value < b.name) {
					return -1;
				} else {
					return 0;
				}
			});
		}
  });
  
  $.ajax({
		url : "https://api.ukdataservice.ac.uk/V1/datasets/EQLS/topics/",
		data : {"user_key" : userkey},
		async : false,
		success : function(data) {
			var topics = [];
			for(var i = 0;i < data.Topics.length;i++) {
			  if(i > 0) {
				var topic = {};
				topic = {"id" : data.Topics[i].TopicId, "value" : data.Topics[i].TopicValue};
			    topics.push(topic);
			  }
			}
			$scope.topics = topics.sort(function(a, b) {
				if(a.value > b.value) {
					return 1;
				} else if(a.value < b.value) {
					return -1;
				} else {
					return 0;
				}
			});
		}
  });
  
});