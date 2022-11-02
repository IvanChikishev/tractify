<template>
  <div>
    <div
      @mousedown="hMouseDown"
      @mouseup="hMouseUp"
      @mousemove="hMouseMove"
      @mouseleave="hMouseUp"
      class="header"
    >
      <div class="header-toolbar">
        <div class="header-toolbar__element">192.168.31.98:8080</div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      isWindowMove: false,
    };
  },

  methods: {
    /**
     * @param event {MouseEvent}
     */
    hMouseDown(event) {
      if (event.target !== event.currentTarget) {
        return;
      }

      this.isWindowMove = true;
      window.electron.headerMouseUp(event.x, event.y);
    },

    /**
     * @param event {MouseEvent}
     */
    hMouseUp(event) {
      this.isWindowMove = false;
    },

    /**
     * @param event {MouseEvent}
     */
    hMouseMove(event) {
      if (this.isWindowMove) {
        window.electron.headerMouseMove(event.x, event.y);
      }
    },
  },
};
</script>

<style lang="scss">
@import "../../resource/fonts/nunito/base.css";

html,
body {
  padding: 0;
  margin: 0;

  font-family: Nunito, serif;
}

.header {
  opacity: 0.6;
  pointer-events: initial;
  height: 54px;
  width: 100%;
  position: absolute;
  background-color: #dcdcdc;
  padding-left: 100px;
  color: #333333;

  display: flex;
  justify-content: center;

  .header-toolbar {
    user-select: none;
    margin-top: 27 - 12.5px;
    width: 40%;
    background-color: #c9c9c9;
    height: 25px;
    border-radius: 4px;
    margin-left: -20%;
    max-width: 500px;
    font-weight: bold;
    font-size: 12px;

    .header-toolbar__element {
      display: inline-block;
      padding: 4px 4px 0 8px;
    }
  }
}
</style>
