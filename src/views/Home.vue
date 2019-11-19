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
                                <b-switch v-model="hideAllMarkers">Hide all markers</b-switch>
                                <b-switch v-model="showRestrictedAreas">Show restricted areas</b-switch>
                            </div>
                            <div class="column has-text-right">
                                <b-button type="is-info" @click="reset">Reset map</b-button>&nbsp;&nbsp;
                                <b-button type="is-info" @click="reset">Fetch burglary data</b-button>
                            </div>
                        </div>
                        <div style="height: 80vh; width: 100%">
                            <l-map :zoom="zoom" :center="center" @ready="mo=>map=mo" @click="clickMap">
                                <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
                                <l-marker v-for="(marker, i) in activeMarkers" :key="i" :lat-lng="marker"
                                          @click="showInfo(marker, i)"></l-marker>
                                <l-polyline
                                        v-if="path"
                                        :lat-lngs="path"
                                        color="green">
                                </l-polyline>
                                <l-polygon v-if="showRestrictedAreas" v-for="area in restrictedAreas"
                                           :lat-lngs="area.path" fill-color="red" :key="area.id">
                                </l-polygon>
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
                        <br/>
                        <h1 class="subtitle">Traffic flow analysis</h1>
                        <template v-if="tfa.selectedPosition">
                            <h5 class="label">
                                {{tfa.selectedPosition.lat.toFixed(4)}} {{tfa.selectedPosition.lng.toFixed(4)}}
                            </h5>
                            <b-field horizontal label="Minutes">
                                <b-input type="number" placeholder="Mins" v-model.number="tfa.mins"></b-input>
                            </b-field>
                            <b-field horizontal label="Tolerance distance">
                                <b-input type="number" step="0.001" placeholder="Tol dist"
                                         v-model.number="tfa.toleraceDistance"></b-input>
                            </b-field>
                            <b-field horizontal label="Tolerance time">
                                <b-input type="number" placeholder="Tol time"
                                         v-model.number="tfa.toleraceTime"></b-input>
                            </b-field>
                            <button class="button is-inverted" @click="drawTrafficFlow">Traffic flow</button>
                        </template>
                        <h5 class="label" v-else>Select a point for traffic flow analysis.</h5>
                    </div>
                </div>
                <div class="columns">
                    <div class="column is-3">
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
        center: L.latLng(52.0101, 4.3654),
        url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        selectedPlates: [],
        plates: [],
        onlyMapPlate: null,
        pathPlate: null,
        showOnlyNear: false,
        selectedI: -1,
        heatmapLayer: null,
        hideAllMarkers: false,
        showRestrictedAreas: true,
        restrictedAreas: [],
        heatMap: {
          items: [],
          max: 0,
          maxZoom: 13,
        },
        map: null,
        tfa: {
          selectedPosition: null,
          mins: 30,
          toleraceDistance: 0.003,
          toleraceTime: 1,
        },
      }
    },
    methods: {
      drawTrafficFlow() {
        let results = []
        let minOffset = (this.tfa.mins - this.tfa.toleraceTime) * 60 * 1000
        let maxOffset = (this.tfa.mins + this.tfa.toleraceTime) * 60 * 1000
        let p = this.tfa.selectedPosition
        let d = this.tfa.toleraceDistance
        this.plates.forEach(plate => {
          let lastTime = null
          plate.observations.forEach(observation => {
            if (p.lat - d <= observation.lat && observation.lat <= p.lat + d && p.lng - d <= observation.lon && observation.lon <= p.lng + d) {
              lastTime = Date.parse(observation.time)
            }
            if (lastTime != null) {
              let ot = Date.parse(observation.time)
              if (lastTime + minOffset <= ot && ot <= lastTime + maxOffset)
                results.push([observation.lat, observation.lon, 1])
            }
          })
        })
        this.heatMap.items = results
        this.heatMap.max = 1
        this.heatMap.maxZoom = 18
      },
      clickMap(e) {
        this.tfa.selectedPosition = e.latlng
      },
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
        //this.center = this.activeMarkers[0]
      },
    },
    computed: {
      path() {
        return this.pathPlate ? this.pathPlate.observations.map(p => [p.lat, p.lon]) : null
      },
      activeMarkers() {
        if (this.hideAllMarkers) {
          return []
        }
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
      axios.get('/api/'
      )
          .then((response) => {
            this.plates = response.data
          })
          .catch(function (error) {
            console.log(error);
          })
      axios.get('/restricted_areas.json')
          .then((response) => {
            this.restrictedAreas = response.data
          })
          .catch(function (error) {
            console.log(error);
          })
    }
  }
</script>
