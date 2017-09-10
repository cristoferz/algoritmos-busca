import { Component } from '@angular/core';
import { capitais, conexoes } from "./capitais";
declare var google: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  map: any;
  cidades = capitais;
  codIbgeOrigem: any;
  codIbgeDestino: any;

  cidadeOrigem: any;
  cidadeDestino: any;

  isBuscaProfundidade: Boolean;
  isBuscaLargura: Boolean;
  isBuscaGulosa: Boolean;
  isBuscaAEstrela: Boolean;

  pathBuscaProfundidade: any;
  pathBuscaLargura: any;
  pathBuscaGulosa: any;
  pathBuscaAEstrela: any;

  conexaoPolylines: any;
  ocultarConexoes: boolean;

  markers: any;
  ocultarMarkers: any;

  pathPolylines = {};

  ngOnInit() {
    var mapProp = {
      center: new google.maps.LatLng(-16.9034, -50.1917),
      zoom: 4,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

    this.initGrafo();

    this.conexaoPolylines = new Array();

    for (var i = 0; i < conexoes.length; i++) {
      var element = conexoes[i];
      this.conexaoPolylines.push(new google.maps.Polyline({
        path: [
          {
            lat: element.origemCapital.latitude,
            lng: element.origemCapital.longitude,
          }, {
            lat: element.destinoCapital.latitude,
            lng: element.destinoCapital.longitude,
          }
        ],
        geodesic: true,
        strokeColor: '#0000FF',
        strokeOpacity: 1.0,
        strokeWeight: 1,
        map: this.map
      }));
      
    }
  }

  toggleConexoes() {
    for (var i = 0; i < this.conexaoPolylines.length; i++) {
      var line = this.conexaoPolylines[i];
      if(this.ocultarConexoes) {
        line.setMap(null);
      } else {
        line.setMap(this.map);
      }
    }
  }

  toggleMarkers() {
    for (var i = 0; i < this.markers.length; i++) {
      var marker = this.markers[i];
      if (this.ocultarMarkers) {
        marker.setMap(null);
      } else {
        marker.setMap(this.map);
      }
    }
  }

  selecionaOrigem = true;

  markerClick(capital) {
    if (this.selecionaOrigem) {
      this.codIbgeOrigem = capital;
    } else {
      this.codIbgeDestino = capital;
    }
    this.selecionaOrigem = !this.selecionaOrigem;
  }

  initGrafo() {
    this.markers = new Array();
    for (var i=0;i<capitais.length;i++) {
      let marker = new google.maps.Marker({
        position: {lat: capitais[i].latitude, lng: capitais[i].longitude},
        map: this.map,
        title: capitais[i].nome + "-" + capitais[i].codIbge
      });
      let codIbgeAtual = capitais[i].codIbge;
      marker.addListener('click', () => {
        this.markerClick(codIbgeAtual);
      })
      this.markers.push(marker);

      capitais[i].vizinhos = [];

      // Monta as conexoes do grafo
      for (var j = 0; j < conexoes.length; j++) {
        var element = conexoes[j];  
        if (element.origem == capitais[i].codIbge) {
          element.origemCapital = capitais[i];
          let origem = this.buscaCidade(element.origem)
          capitais[i].vizinhos.push({ cidade: this.buscaCidade(element.destino), distancia: this.distanciaArea(capitais[i].latitude, capitais[i].longitude, origem.latitude, origem.longitude) });
        } else if (element.destino == capitais[i].codIbge) {
          element.destinoCapital = capitais[i];
          let destino = this.buscaCidade(element.destino)
          capitais[i].vizinhos.push({cidade: this.buscaCidade(element.origem), distancia: this.distanciaArea(capitais[i].latitude, capitais[i].longitude, destino.latitude, destino.longitude) });
        }
      }
    }
  }

  buscaCidade(codIbge: string): any {
    for (var i = 0; i < capitais.length; i++) {
      var capital = capitais[i];
      if (capital.codIbge == codIbge) {
        return capital;
      }
    }
    return null;
  }

  buscaProfundidade() {
    var ibgeOrigem = this.codIbgeOrigem;
    var ibgeDestino = this.codIbgeDestino;
    var cidadeOrigem = this.cidadeOrigem;
    var cidadeDestino = this.cidadeDestino;

    var resultPath = [ cidadeOrigem ];
    var cidadesPercorridas = [];

    if(this.buscaProfundidadeRecursivo(cidadeOrigem, cidadeDestino, cidadesPercorridas, resultPath)) {
      this.pathBuscaProfundidade = resultPath;
      this.printPath(resultPath, "#00FF00", "profundidade");

    } else {
      console.log("Nao encontrou");
    }
  }

  buscaProfundidadeRecursivo(origem: any, destino: any, cidadesPercorridas: any, resultPath: any) {
    for (var i = 0; i < origem.vizinhos.length; i++) {
      var vizinho = origem.vizinhos[i].cidade;
      
      if(cidadesPercorridas.indexOf(vizinho) != -1) {
        // Já foi visitado, ignora
        continue;
      }
      cidadesPercorridas.push(vizinho);
      if (vizinho.codIbge == destino.codIbge) {
        resultPath.splice(1, 0, vizinho);
        return true;
      } else {
        if(this.buscaProfundidadeRecursivo(vizinho, destino, cidadesPercorridas, resultPath)) {
          resultPath.splice(1, 0, vizinho);
          return true;
        }
      }
    }
    return false;
  }

  buscaLargura() {
    var cidadesPercorridas = new Array();
    var cidadeOrigem = this.cidadeOrigem;
    var cidadeDestino = this.cidadeDestino;

    let filaCidades = new Array();
    filaCidades.push({ cidade: cidadeOrigem, pathAnterior: [] });
    cidadesPercorridas.push(cidadeOrigem);
    let resultPath = new Array();
    while (filaCidades.length > 0) {
      // Percorre todos os vizinhos da cidade corrente
      let cidadeAtual = filaCidades[0].cidade;
      let pathAtual = filaCidades[0].pathAnterior.slice();
      pathAtual.push(cidadeAtual);
      filaCidades.splice(0,1);
      for (var i = 0; i < cidadeAtual.vizinhos.length; i++) {
        var cidadeVizinha = cidadeAtual.vizinhos[i].cidade;
        if (cidadesPercorridas.indexOf(cidadeVizinha) != -1) {
          // Já passou por essa cidade, parte pra próxima
          continue;
        }
        if (cidadeVizinha == cidadeDestino) {
          pathAtual.push(cidadeVizinha);
          resultPath = pathAtual;
          filaCidades.splice(0, filaCidades.length);
          break;
        }
        filaCidades.push( { cidade: cidadeVizinha, pathAnterior: pathAtual });
        cidadesPercorridas.push(cidadeVizinha);
      }
    }

    this.pathBuscaLargura = resultPath;
    this.printPath(resultPath, "#FF0000", "largura");
  }

  buscaGulosa() {
    var cidadesPercorridas = new Array();
    var cidadeOrigem = this.cidadeOrigem;
    var cidadeDestino = this.cidadeDestino;
    let cidadeAtual = cidadeOrigem;
    cidadesPercorridas.push(cidadeOrigem);

    let path = new Array();
    path.push(cidadeOrigem);
    while(true) {
      // Procura a cidades com a menor distancia
      let cidadeMaisProximaDestino = null;
      let distanciaMaisProximaDestino = 99999999999999999;
      for (var i = 0; i < cidadeAtual.vizinhos.length; i++) {
        var vizinho = cidadeAtual.vizinhos[i].cidade;
        if (cidadesPercorridas.indexOf(vizinho) != -1) {
          // Aborta pois já passou por esse
          continue;
        }
        let distanciaDestino = this.distanciaArea(vizinho.latitude, vizinho.longitude, cidadeDestino.latitude, cidadeDestino.longitude);
        if (cidadeMaisProximaDestino == null) {
          cidadeMaisProximaDestino = vizinho;
          distanciaMaisProximaDestino = distanciaDestino;
        } else {
          if (distanciaDestino < distanciaMaisProximaDestino) {
            cidadeMaisProximaDestino = vizinho;
            distanciaMaisProximaDestino = distanciaDestino;
          }
        }
        cidadesPercorridas.push(vizinho);
      }
      cidadeAtual = cidadeMaisProximaDestino;
      path.push(cidadeAtual);
      if (cidadeAtual == cidadeDestino) {
        break;
      }
    }
    this.pathBuscaGulosa = path;
    this.printPath(path, "#FFFF00", "gulosa");

  }

  buscaAEstrela() {
    var cidadesPercorridas = new Array();
    var cidadeOrigem = this.cidadeOrigem;
    var cidadeDestino = this.cidadeDestino;
    let cidadeAtual = cidadeOrigem;
    cidadesPercorridas.push(cidadeOrigem);

    let path = new Array();
    path.push(cidadeOrigem);
    while(true) {
      // Procura a cidades com a menor distancia
      let cidadeMaisProximaDestino = null;
      let distanciaMaisProximaDestino = 99999999999999999;
      for (var i = 0; i < cidadeAtual.vizinhos.length; i++) {
        var vizinho = cidadeAtual.vizinhos[i].cidade;
        if (cidadesPercorridas.indexOf(vizinho) != -1) {
          // Aborta pois já passou por esse
          continue;
        }
        let distancia = cidadeAtual.vizinhos[i].distancia;
        let distanciaDestino = this.distanciaArea(vizinho.latitude, vizinho.longitude, cidadeDestino.latitude, cidadeDestino.longitude);
        distanciaDestino +=  distancia;
        if (cidadeMaisProximaDestino == null) {
          cidadeMaisProximaDestino = vizinho;
          distanciaMaisProximaDestino = distanciaDestino;
        } else {
          if (distanciaDestino < distanciaMaisProximaDestino) {
            cidadeMaisProximaDestino = vizinho;
            distanciaMaisProximaDestino = distanciaDestino;
          }
        }
      }
      cidadesPercorridas.push(cidadeAtual);
      cidadeAtual = cidadeMaisProximaDestino;
      path.push(cidadeAtual);
      if (cidadeAtual == cidadeDestino) {
        break;
      }
    }
    this.pathBuscaAEstrela = path;
    this.printPath(path, "#CCCCCC", "aestrela");
  }  

  distanciaArea(latitudeOrigem: number,longitudeOrigem: number, latitudeDestino: number, longitudeDestino: number) {
    let d2r = 0.017453292519943295769236;
      
    let dlong = (longitudeDestino - longitudeOrigem) * d2r;
    let dlat = (latitudeDestino - latitudeOrigem) * d2r;
      
    let temp_sin = Math.sin(dlat/2.0);
    let temp_cos = Math.cos(latitudeOrigem * d2r);
    let temp_sin2 = Math.sin(dlong/2.0);
      
    let a = (temp_sin * temp_sin) + (temp_cos * temp_cos) * (temp_sin2 * temp_sin2);
    let c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
    return 6368.1 * c;
  }

  distanciaPath(path: any) {
    if (path == null) {
      return "--";
    }
    let result = 0;
    for (var i = 1; i < path.length; i++) {
      let distancia = this.distanciaArea(path[i-1].latitude, path[i-1].longitude, path[i].latitude, path[i].longitude);
      result += distancia;
    }
    return Math.round(result);
  }

  printPath(resultPath: any, color: any, key: string) {
    if (this.pathPolylines[key] != null) {
      this.pathPolylines[key].setMap(null);
    }
    var path = [];
    for (var i = 0; i < resultPath.length; i++) {
      var cidade = resultPath[i];
      path.push({lat: cidade.latitude, lng: cidade.longitude});
    }

    this.pathPolylines[key] = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 1,
      strokeWeight: 5,
      map: this.map
    });
  }

  toggleBuscas() {
    if( this.pathPolylines['profundidade'] != undefined) {
      if (this.isBuscaProfundidade) {
        this.pathPolylines['profundidade'].setMap(this.map);
      } else {
        this.pathPolylines['profundidade'].setMap(null);
      }
    }
    if( this.pathPolylines['largura'] != undefined) {
      if (this.isBuscaLargura) {
        this.pathPolylines['largura'].setMap(this.map);
      } else {
        this.pathPolylines['largura'].setMap(null);
      }
    }
    if( this.pathPolylines['gulosa'] != undefined) {
      if (this.isBuscaLargura) {
        this.pathPolylines['gulosa'].setMap(this.map);
      } else {
        this.pathPolylines['gulosa'].setMap(null);
      }
    }
    if( this.pathPolylines['aestrela'] != undefined) {
      if (this.isBuscaAEstrela) {
        this.pathPolylines['aestrela'].setMap(this.map);
      } else {
        this.pathPolylines['aestrela'].setMap(null);
      }
    }
  }

  buscar() {
    // Confere se estão selecionadas 2 cidades e diferentes
    if (this.codIbgeOrigem == null || this.codIbgeDestino == null) {
      alert("É necessário preencher ambas as cidades para realizar a busca.")
      return;
    }

    if (this.codIbgeOrigem == this.codIbgeDestino) {
      alert("As cidades devem ser diferentes para executar a busca");
      return;
    }

    if (!this.isBuscaProfundidade && !this.isBuscaLargura && !this.isBuscaGulosa && !this.isBuscaAEstrela) {
      alert("É necessário selecionar pelo menos 1 algoritmo de busca");
      return;
    }

    this.cidadeOrigem = this.buscaCidade(this.codIbgeOrigem);
    this.cidadeDestino = this.buscaCidade(this.codIbgeDestino);

    // Limpa as rotas atuais
    for (var key in this.pathPolylines) {
      this.pathPolylines[key].setMap(null);
      this.pathPolylines[key] = undefined;
      delete this.pathPolylines[key];
    }

    if(this.isBuscaProfundidade) {
      this.buscaProfundidade();
    }

    if (this.isBuscaLargura) {
      this.buscaLargura();
    }

    if (this.isBuscaGulosa) {
      this.buscaGulosa();
    }

    if (this.isBuscaAEstrela) {
      this.buscaAEstrela();
    }
  }

  
}
