<template>
    <div>
        <section class="section">
            <div class="container is-fluid">
                <div class="columns">
                    <div class="column is-8-tablet">
                        <div class="columns">
                            <div class="column">
                                <h2 class="subtitle">Map</h2>
                            </div>
                            <div class="column has-text-right">
                                <b-button type="is-info" @click="reset">Reset map</b-button>
                            </div>
                        </div>
                        <div style="height: 80vh; width: 100%">
                            <l-map :zoom="zoom" :center="center" @ready="mo=>map=mo">
                                <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
                                <l-marker v-for="(marker, i) in activeMarkers" :key="i" :lat-lng="marker"
                                          @click="showInfo(marker, i)"></l-marker>
                                <l-polyline
                                        v-if="path"
                                        :lat-lngs="path"
                                        color="green">
                                </l-polyline>
                            </l-map>
                        </div>
                    </div>
                    <div class="column is-4-tablet">
                        <h1 class="subtitle">Plates</h1>
                        <b-field horizontal label="Search">
                            <b-input v-model="search" type="search" icon="search"></b-input>
                        </b-field>
                        <b-switch v-model="showOnlyNear">Show only plates nearby selected</b-switch>
                        <h2 class="subtitle"></h2>
                        <HomeTable
                                :heat-map="heatMap"
                                :data="visiblePlates"
                                :only-map-plate.sync="onlyMapPlate"
                                :path-plate.sync="pathPlate">
                        </HomeTable>
                        <p>Click an observation on the map to show plate {{markerInfo}}</p>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script>

  import HomeTable from './HomeTable'

  const axios = require('axios');


  export function flatMap(arr, lambda) {
    return arr.reduce((acc, p) => acc.concat(lambda(p)), [])
  }


  export default {
    name: 'Home',
    components: {HomeTable},
    data() {
      return {
        search: '',
        zoom: 13,
        markerInfo: '',
        center: L.latLng(47.413220, -1.219482),
        url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        selectedPlates: [],
        plates: [],
        onlyMapPlate: null,
        pathPlate: null,
        showOnlyNear: false,
        selectedI: -1,
        heatmapLayer: null,
        heatMap: {
          items: [],
          max: 0,
        },
        map: null,
      }
    },
    methods: {
      reset() {
        this.onlyMapPlate = null
        this.pathPlate = null
        if (this.heatmapLayer) {
          this.map.removeLayer(this.heatmapLayer)
        }
      },
      showInfo(marker, i) {
        let ap = marker
        this.markerInfo = ap.time
        this.selectedPlates = this.plates.filter(p => p.observations.filter(o => o.lat === ap.lat && o.lon === ap.lng).length > 0)
        this.showOnlyNear = true
        this.selectedI = i
      },
      getMarkerPointsForPlate(p) {
        return p.observations.map(o =>
            ({
              lat: o.lat, lng: o.lon,
              title: p.plate_number + ' ' + o.car_model,
              alt: 'none',
              time: o.time,
            })
        )
      }
    },
    watch: {
      heatMap: {
        handler() {
          if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer)
          }
          this.heatmapLayer = L.heatLayer(this.heatMap.items, {
            radius: 50,
            blur: 70,
            maxZoom: 13,
            color: {0: 'transparent', 1: 'red'}
          }).addTo(this.map)
        },
        deep: true,
      },
      plates() {
        this.center = this.activeMarkers[0]
      },
    },
    computed: {
      path() {
        return this.pathPlate ? this.pathPlate.observations.map(p => [p.lat, p.lon]) : null
      },
      activeMarkers() {
        return this.onlyMapPlate === null ? this.allLastMarkers : this.getMarkerPointsForPlate(this.onlyMapPlate)
      },
      visiblePlates() {
        let plates = this.showOnlyNear ? this.selectedPlates : this.plates
        if (this.search.length > 0) {
          plates = this.plates.filter(p => p.plate_number.toLowerCase().indexOf(this.search.toLowerCase()) > -1)
        }
        return plates
      },
      allLastMarkers() {
        return this.plates.map(p => {
          let a = this.getMarkerPointsForPlate(p)
          return a[a.length - 1]
        })
      }
    },
    created() {
      axios.get(window.location.href.indexOf('locahost') === -1 ? 'http://localhost:8000/api/' :
          'https://whispering-basin-20961.herokuapp.com/api/'
      )
          .then((response) => {
            this.plates = response.data
          })
          .catch(function (error) {
            console.log(error);
          })
          .finally(function () {
          });
    }
  }
</script>
