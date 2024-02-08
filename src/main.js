import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './index.css'
import './assets/DateFormat'
import * as d3 from "d3";

window.d3 = d3


function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}
window.map_range = map_range
// https://cn.vitejs.dev/guide/features.html#glob-import
// 這樣做可以import json格式檔案
// import field from './test.json'
// console.log(field)

createApp(App).use(store).use(router).mount('#app')