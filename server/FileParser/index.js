const fs = require('fs')
const Router = require('koa-router')
const router = new Router()
const compilerSfc = require('@vue/compiler-sfc')
const compilerDom = require('@vue/compiler-dom')
import { reWriteImport, resolvePath } from '../utils'

router.get('/', async (ctx, next) => {
  // 访问根目录 渲染我们的index.html
  let content = fs.readFileSync(resolvePath('index.html'), 'utf-8')
  content = content.replace('<script', `
    <script>
      window.process = {
        env: {
          NODE_EV: 'dev'
        }
      }
    </script>
    <script
  `)
  ctx.type = "text/html"
  ctx.body = content
})

router.get(/(\.css)$/i, async (ctx, next) => {
  const { request: {
    url
  }} = ctx
  const filePath = resolvePath(url.slice(1))
  const file = fs.readFileSync(filePath, 'utf-8')
  const content = `
  const css = "${file.replace(/\n/g, '')}"
  const link = document.createElement('style')
  link.setAttribute('type', 'text/css')
  document.head.appendChild(link)
  link.innerHTML = css
  export default css
  `
  ctx.type = 'application/javascript'
  ctx.body = reWriteImport(content)
})

router.get(/(\.js)$/i, async (ctx, next) => {
  const { request: {
    url
  }} = ctx
  const filePath = resolvePath(url.slice(1))
  ctx.type = 'application/javascript'
  const content = fs.readFileSync(filePath, 'utf-8')
  ctx.body = reWriteImport(content)
})

router.get(/^(\/@modules\/)/i, async (ctx, next) => {
  // 这个模块 不是本地文件 我们要在node_modules中查找
  // 注意： 例如找vue  node_modules -> vue -> package.json ->查找module （main是使用require时使用路径  module是使用es6import时走的路径） 这里我们找到module
  const { request: {
    url
  }} = ctx
  const prefix = resolvePath('node_modules', url.replace('/@modules/', ''))
  const module = require(prefix + '/package.json').module
  const content = fs.readFileSync(prefix+'/'+module, 'utf-8')
  ctx.type = 'application/javascript'
  ctx.body = reWriteImport(content)
})

router.get(/(\.vue)/i, async (ctx, next) => {
  // import xx from xx.vue
  // 1.单文件组件解析
  const { request: {
    url,
    query
  }} = ctx
  const filePath = resolvePath(url.split('?')[0].slice(1))
  // 解析单文件组件 需要官方的库 @vue/compiler-sfc
  const { descriptor } = compilerSfc.parse(fs.readFileSync(filePath, 'utf-8'))
  // console.log(descriptor)
  // 这里需要做以下三件事
  // export default 转成 const __script
  // 添加 import {render as __render} from "/src/App.vue?type=template"
  // 添加__script.render = __render
  // 添加 export default __script
  if (!query.type) {
    // 如果query.type说明还没有转换过
    ctx.type = 'application/javascript'
    ctx.body = `
${reWriteImport(descriptor.script.content.replace('export default', 'const __script = '))}
import {render as __render} from "${url}?type=template"
__script.render = __render
export default __script
    `
  } else if (query.type === 'template') {
    // 解析我们的template 编译成render函数 需要用到@vue/compiler-dom
    const template = descriptor.template
    const render = compilerDom.compile(template.content, { mode: "module" }).code
    // console.log(render)
    ctx.type = 'application/javascript'
    ctx.body = reWriteImport(render)
  }
})

export default router