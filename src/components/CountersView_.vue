<template functional>
    <div class="d-flex justify-space-around">
        <div
            v-for="counter in props.counters"
            :key="counter.key"
            class="ind-counter pa-2 d-flex flex-column align-center justify-start subtitle-2"
        >
            <span :class="[counter.color + '--text', 'text-uppercase']">
                {{ counter.label }}
            </span>
            <div class="d-flex flex-column justify-start align-center counter-content body-2">
                <span :class="[counter.color + '--text', 'text--lighten-1']">
                    {{ counter.total }}
                </span>
                <div v-if="counter.increaseCount" class="mt-n1 d-flex align-center">
                    <v-icon size="1rem" :class="[counter.color + '--text', 'text--accent-4']">
                        {{ counter.direction === "up" ? "$arrowUp" : "$arrowDown" }}
                    </v-icon>
                    <span :class="[counter.color + '--text', 'text--accent-4 caption']">
                        {{ counter.increaseCount }}
                    </span>
                </div>
            </div>
            <div class="sparkline-chart">
                <spark-line :timelineData="counter" :id="counter.label + '_sparkline'">
                </spark-line>
            </div>
        </div>
    </div>
</template>

<script>
import SparkLine from "./SparkLine";
export default {
    name: "CountersView",
    components: { SparkLine },
    data() {
        return {};
    },
};
</script>
<style scoped>
.counter-content {
    height: 2rem;
}
.sparkline-chart {
    height: 2rem;
}
</style>
