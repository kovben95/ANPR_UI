<template>
    <div style="height: 300px; width: 100%">
        <l-map :zoom="zoom" :center="center">
            <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
            <l-marker v-for="(marker, i) in markers" :key="i" :lat-lng="marker"></l-marker>
        </l-map>
    </div>
</template>

<script>

  const axios = require('axios');

  export default {
    name: 'Home',
    data() {
      return {
        zoom: 13,
        center: L.latLng(47.413220, -1.219482),
        url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        markers: []
      }
    },
    created() {
      axios.get('/user?ID=12345')
          .then((response) => {
            console.log(response);
            this.markers = response.data.points.map(p => L.latLng(p.lat, p.lng))
          })
          .catch(function (error) {
            console.log(error);
          })
          .finally(function () {
          });
    }
  }
</script>
