var iss = 'http://api.open-notify.org/iss-now.json';

function main() {
	title();
	observeChanges();
	loadPage('glowna.html');
}

function lati(x) {
	if (x<0) {
		x = -x + '° S';
	}
	else {
		x = x + '° N';
	}
	return x;
}

function longi(x) {
	if (x<0) {
		x = -x + '° W';
	}
	else {
		x = x + '° E';
	}
	return x;
}	

function observeChanges() {
	//sprawdzanie czy zmienił się div o id=content
	var target = document.getElementById('content');
	var config = { childList: true };
	var callback = function(mutationsList) {
		//jeśli się zmienił i istnieje w nim div o id=currencies wywołaj funkcje tableNBP
		if (typeof(document.getElementById('currencies')) != 'undefined' & document.getElementById('currencies') != null) {
			tableNBP('EUR');
			tableNBP('USD');
			tableNBP('GBP');
			tableNBP('CHF');
		}
		
		//jeśli istnieje w nim div o id=iss-position wywołaj funkcję issPosition
		if (typeof(document.getElementById('iss-position')) != 'undefined' & document.getElementById('iss-position') != null) {
			issPosition(window.iss);
		}
	};
	var observer = new MutationObserver(callback);
	observer.observe(target, config);
}

function currency(name) {
	return 'http://api.nbp.pl/api/exchangerates/rates/a/' + name + '/last/7?format=json';
}

function tableNBP(name) {
	//pobieranie danych z API
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		//jeśli udało się pobrać
		if (this.readyState === 4 & this.status === 200) {
			//przetwarzanie JSON na obiekt JS
			var data = JSON.parse(this.responseText);
			
			//wstawianie tabeli do diva o id=currencies
			document.getElementById('currencies').innerHTML += '<div class="col-xs-12 col-lg-6"><div><h4 class="my-3">Tabela kursu ' + name + '</h4></div><div><table id="table' + name + '" class="data"><thead><tr><th>Data</th><th>Kurs</th></tr></thead><tbody></tbody></table></div><div id="chart' + name + '"></div></div>';
			var table = document.getElementById('table' + name).getElementsByTagName('tbody')[0];
			
			//wstawianie wierszy do tabeli
			var curarray = new Array(data.rates.length + 1);
			for (var i=0; i < curarray.length; i++) {
				curarray[i] = new Array(2);
			}
			curarray[0][0] = 'day';
			curarray[0][1] = name;
			
			for (var j=1; j < curarray.length; j++) {
				curarray[j][0] = data.rates[j-1].effectiveDate;
				curarray[j][1] = data.rates[j-1].mid;
			}
			
			for (var x in data.rates) {
				var row = table.insertRow(-1);
				var cell1 = row.insertCell(0);
				var cell2 = row.insertCell(1);
				//kolorowanie wierszy
				if (x%2 == 1) {
					row.className = 'even p-2';
				}
				else if (x%2 == 0) {
					row.className = 'odd p-2';
				}
				//wrzucanie danych do komórek tabeli
				cell1.innerHTML = data.rates[x].effectiveDate;
				cell2.innerHTML = data.rates[x].mid;
			}
			// tu wstaw linijki z generowaniem wykresu

		    google.charts.load('current', {'packages':['corechart', 'bar']});                                                                 
			google.charts.setOnLoadCallback(drawStuff);                                                                                       
			  
			function drawStuff(array) {                                                                                                            
				var chartDiv = document.getElementById('chart' + name);                                                                  
				var chartData = google.visualization.arrayToDataTable(curarray);                                                                                                                         

				var classicOptions = {                                                                                                          
					width: 500,                                                                                                                   
					series: {                                                                                                                     
						0: {targetAxisIndex: 0},                                                                                                    
					},                                                                                                                            
				};                                                                                                                              

				function drawClassicChart() {                                                                                                   
					var classicChart = new google.visualization.ColumnChart(chartDiv);                                                            
					classicChart.draw(chartData, classicOptions);                                                                                
				}

				drawClassicChart();
			};
			// koniec
		}
	};

	xhr.open('GET', currency(name), true);
	xhr.send();
}

//pracuję nad tym :D
function issPosition(adress) {
	document.getElementById('iss-position').innerHTML += '<div class="col-xs-12 col-md-4"><div><h4 class="my-3">Współrzędne geograficzne</h4></div><div><table id="tableiss" class="data"><thead><tr><th>Współrzędna</th><th>Wartość</th></tr></thead><tbody></tbody></table></div></div>';
	document.getElementById('iss-position').innerHTML += '<div class="col-xs-12 col-md-8"><div><h4 class="my-3">Pozycja na mapie</h4></div><div id="issmap"></div></div>';
	
	const map = L.map('issmap').setView([0, 0], 4);
	var marker = L.marker([0, 0]).addTo(map);
	const attribution = '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>';
	const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	const tiles = L.tileLayer(tileUrl,{attribution});
	tiles.addTo(map);
	
	var table = document.getElementById('tableiss').getElementsByTagName('tbody')[0];
	var row1 = table.insertRow(0);
	var cell1 = row1.insertCell(0);
	var cell2 = row1.insertCell(1);
	var row2 = table.insertRow(1);
	var cell3 = row2.insertCell(0);
	var cell4 = row2.insertCell(1);
	
	row1.className = 'odd p-2';
	row2.className = 'even p-2';

	function refresh() {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (this.readyState === 4 & this.status === 200) {
				var data = JSON.parse(this.responseText);			
				var lat = parseFloat(data.iss_position.latitude);
				var lon = parseFloat(data.iss_position.longitude);

				marker.setLatLng([lat, lon]);
				map.setView([lat, lon]);
				
				cell1.innerHTML = 'Szerokość';
				cell2.innerHTML = lati(lat);
				cell3.innerHTML = 'Długość';
				cell4.innerHTML = longi(lon);
			}
		};
		
		xhr.open('GET', adress, true);
		xhr.send();
	}
	
	refresh();
	setInterval(refresh, 1000);
}

function title() {
	document.title = 'Projekt egzaminacyjny';
	document.getElementsByTagName('h1')[0].innerHTML += document.title;
}

//dynamiczne ładowanie podstron z plików
function loadPage(page) {
	var xhr = new XMLHttpRequest();
	xhr.addEventListener('load', function() {
		if (xhr.status === 200) {
			document.getElementById('content').innerHTML = xhr.response;
		}
	});

	xhr.addEventListener('error', function() {
		alert('Niestety nie udało się nawiązać połączenia');
	});
	xhr.open('GET', page, true);
	xhr.send();
}