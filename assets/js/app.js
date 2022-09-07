const API_KEY = '3kLpEzjfT-xLnNMsgh6mkqLVDF6aKfExFP9k4Jjeu6Y';

document.addEventListener('DOMContentLoaded', init, false);

let origem,buscarUmaRota, destino, rotaEmTexto, bloquearUmaRota, rotaBloqueada, listaRotaBloqueada;

let map, platform, router, geocoder;

let rotasBloqueadas = [];

function init() {
	platform = new H.service.Platform({
		'apikey': API_KEY
	});

	let defaultLayers = platform.createDefaultLayers();

	map = new H.Map(
		document.getElementById('map'),
		defaultLayers.vector.normal.map,
		{
			zoom: 5,
			center: { lat: -8.3678162, lng: -35.0315702 },  
			pixelRatio: window.devicePixelRatio || 1
		}
	);
	

	router = platform.getRoutingService(null,8);
	geocoder = platform.getSearchService();

	buscarUmaRota = document.querySelector('#buscarUmaRota');
	buscarUmaRota.addEventListener('click', mostrarRota);

	origem = document.querySelector('#origem');
	destino = document.querySelector('#destino');

	rotaEmTexto = document.querySelector('#rotaEmTexto');

	bloquearUmaRota = document.querySelector('#bloquearUmaRota');
	bloquearUmaRota.addEventListener('click', adicionarBloqueioRota);
	rotaBloqueada = document.querySelector('#rotaBloqueada');

	listaRotaBloqueada = document.querySelector('#listaRotaBloqueada');

	origem.value = 'IPOJUCA, PE, BR';
	destino.value = 'LOUVEIRA , SP, BR';
	rotaBloqueada.value = 'Tancredo Neves, MG, BR';

}

async function mostrarRota() {
	console.log('Mostrar rota');

	let rotaOrigem = origem.value;
	let rotaDestino = destino.value;

	if(!rotaOrigem) {
		alert('Campo origem nao pode estar em branco.');
		return;
	}

	if(!rotaDestino) {
		alert('Campo destino nao pode estar em branco.');
		return;
	}

	rotaEmTexto.innerHTML = '<p><i>Gerando rota !!</i></p>';

	let origemPos = await codigoGeolocalizacao(rotaOrigem);
	let destinoPos = await codigoGeolocalizacao(rotaDestino);

	console.log(origemPos, destinoPos);

    let routeRequestParams = {
        routingMode: 'fast',
        transportMode: 'car',
        origin: origemPos.lat+','+origemPos.lng, 
		destination: destinoPos.lat+','+destinoPos.lng,  
        return: 'polyline,turnByTurnActions,actions,instructions,travelSummary'
    };


	for(let i=0;i<rotasBloqueadas.length;i++) {
		if(!routeRequestParams.via) routeRequestParams.via = [];
		let value = rotasBloqueadas[i].pos.lat+','+rotasBloqueadas[i].pos.lng;
		routeRequestParams.via.push(value);
	}
	

	console.log(routeRequestParams);
	let route = await buscarRota(routeRequestParams);
	console.log(route);
	adicionarRotaNoMapa(route);
	adicionarRotaEmTexto(route);
}
async function codigoGeolocalizacao(s) {
	let params = {
		q:s
	};

	return new Promise((resolve, reject) => {
		geocoder.geocode(
			params,
			r => {
				resolve(r.items[0].position);
			},
			e => reject(e)
		);
	});
}

async function buscarRota(p) { 
		
		let url = `https://router.hereapi.com/v8/routes?origin=${p.origin}&transportMode=${p.transportMode}&routingMode=${p.routingMode}&destination=${p.destination}&apikey=${API_KEY}&return=${p.return}`;
		if(p.via) {
			p.via.forEach(v => {
				url += '&via='+v;
			});
		}
		console.log(url);
		let resp = await fetch(url);
		let data = await resp.json();
		return data.routes[0];

}

function adicionarRotaNoMapa(route) {

	let obs = map.getObjects();
	obs.forEach(ob => {
		if(ob.type === H.map.Object.Type.SPATIAL) map.removeObject(ob);
	});

  route.sections.forEach((section) => {
    let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);

    let polyline = new H.map.Polyline(linestring, {
      style: {
        lineWidth: 4,
        strokeColor: 'green'
      }
    });

    map.addObject(polyline);
  });
}

function adicionarRotaEmTexto(route) {
	
	let desc = '<ol>';
	route.sections.forEach(s => {
		s.actions.forEach((a, idx) => {
			desc += `<li>${a.instruction}</li>`;
		});
	});
	desc += '</ol>';
	rotaEmTexto.innerHTML = desc;

}

async function adicionarBloqueioRota() {
	let bloquearRota = rotaBloqueada.value;
	if(!bloquearRota) {
		alert('Digite uma rota pra ser bloqueada!');
		return;
	}

	let pos = await codigoGeolocalizacao(bloquearRota);
	rotasBloqueadas.push({label:bloquearRota, pos});
	verRotaBloqueada();
	rotaBloqueada.value = '';
	console.log(pos);
}

function verRotaBloqueada() {
	let s = '<ul>';
	rotasBloqueadas.forEach((wp,x) => {
		s += `<li onclick='removerBloqueioRota(${x})' class='waypointItem' title='Remover'>${wp.label}</li>`;
	});
	s += '</ul>';

	listaRotaBloqueada.innerHTML = s;

}

function removerBloqueioRota(idx) {
	console.log('remove '+idx);
	for(let x=rotasBloqueadas.length-1;x>=0;x--) {
		console.log(x,idx);
		if(x === idx) rotasBloqueadas.splice(idx,1);
	}
	verRotaBloqueada();
}