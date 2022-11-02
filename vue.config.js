const { createApp } = require("vue");
const { createWebHashHistory, createRouter } = require("vue-router");
const { addIcons, OhVueIcon } = require("oh-vue-icons");
const FaIcons = require("oh-vue-icons/icons/fa");
const iView = require("iview");

addIcons(...Object.values({ ...FaIcons }));

const routes = [
  { path: "/", component: () => import("./www/views/index.vue") },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

createApp({})
  .component("v-icon", OhVueIcon)
  .use(router)
  .use(iView.default)
  .mount("#app");
