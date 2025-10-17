const fs = require('fs');
const yaml = require('js-yaml');
const axios = require('axios');

// 加载用户提供的覆写脚本
const rewriteCode = fs.readFileSync('scripts/rewrite.js', 'utf-8');

// 创建模拟环境
function createContext() {
  const context = {
    console,
    require,
    module: { exports: {} },
  };
  const script = new Function('module', 'exports', rewriteCode);
  script(context.module, context.module.exports);
  return context.module.exports;
}

(async () => {
  const subUrl = process.env.SUB_URL || 'https://your.subscription.link/config.yaml';

  // 拉取订阅
  const res = await axios.get(subUrl);
  let config = yaml.load(res.data);

  // 获取 main 函数
  const rewrite = createContext();
  if (typeof rewrite.main !== 'function') {
    throw new Error('❌ 脚本必须导出 function main(config)');
  }

  // 执行覆写
  config = rewrite.main(config);

  // 输出
  const output = yaml.dump(config);
  fs.writeFileSync('output/config.yaml', output);
  console.log('✅ 最终配置已生成：output/config.yaml');
})();
