<template>
  <div>Hello World</div>
  <h1 class="count">{{ count }}</h1>
  <p class="add-btn" @click="add">增加</p>
</template>

<script>

export default {
  name: 'App',
  data() {
    return {
      count: 0
    }
  },
  methods: {
    add() {
      this.count ++
    }
  }
}
</script>
