<template>
    <b-table
            :data="data"
            ref="table"
            paginated
            per-page="5"
            detailed
            detail-key="id"
            show-detail-icon
            aria-next-label="Next page"
            aria-previous-label="Previous page"
            aria-page-label="Page"
            aria-current-label="Current page">

        <template slot-scope="props">
            <b-table-column field="plate_number" label="" sortable>
                {{ props.row.country }}
            </b-table-column>
            <b-table-column field="plate_number" label="Plate number" sortable>
                {{ props.row.plate_number }}
            </b-table-column>

            <b-table-column field="plate.last_observation.time" label="Date" sortable centered>
                    <span class="tag is-success">
                        {{niceTime(props.row.last_observation.time)}}
                    </span>
            </b-table-column>

        </template>

        <template slot="detail" slot-scope="props">
            <article class="media">
                <div class="media-content">
                    <div class="content">
                        <p>
                            <a class="button is-primary is-small" @click="mapPlate(props.row)"><b-icon icon="map"></b-icon></a>&nbsp;
                            <a class="button is-info is-small" @click="setPathPlate(props.row)"><b-icon icon="history"></b-icon></a>&nbsp;
                            <a class="button is-danger is-small" @click="showHeatMap(props.row)"><b-icon icon="fire"></b-icon></a>&nbsp;
                            <strong>{{ props.row.country }} {{ props.row.plate_number }} </strong>
                            <small class="is-pulled-right">{{niceTime(props.row.last_observation.time)}} </small>
                        </p>
                        <ul>
                            <li v-for="obs in props.row.observations"><i>{{niceTime(obs.time)}}</i> {{obs.car_model}}</li>
                        </ul>
                    </div>
                </div>
            </article>
        </template>
    </b-table>
</template>

<script>
  export default {
    name: "HomeTable",
    props: {
      data: Array,
      heatMap: Object,
      onlyMapPlate: Object,
      pathPlate: Object,
    },
    methods: {
      niceTime(inp){
        return inp.split('.')[0].replace('T', ' ')
      },
      showHeatMap(plate){
        this.heatMap.items = plate.observations.map(o => [o.lat, o.lon, 1])
        this.heatMap.max = 1
        this.heatMap.maxZoom = 13
      },
      mapPlate(plate){
        this.$emit('update:onlyMapPlate', plate)
      },
      setPathPlate(plate){
        this.$emit('update:pathPlate', plate)
      }
    }
  }
</script>

<style scoped>

</style>