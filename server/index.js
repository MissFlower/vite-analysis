
const Koa = require('koa')
const app = new Koa()
import router from './FileParser'

app.use(router.routes())
app.use(router.allowedMethods())
// 在 router 实例上加 allowedMethods,所有的接口都可以支持 options 请求了

app.listen(9000, () => {
  console.log('server is runing...')
})
