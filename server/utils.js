const { resolve } = require('path')
// 改造.js文件内容  不是/ ./ ../ 开头的import 替换成/@modules/开头的
export function reWriteImport(content) {
  const reg = / from ['|"]([^'"]+)['|"]/g
  return content.replace(reg, function($, $1) {
    return $1.startsWith('./') ? $ : ` from '/@modules/${$1}'`
  })
}

export function resolvePath() {
  return resolve(__dirname, '../', ...arguments)
}