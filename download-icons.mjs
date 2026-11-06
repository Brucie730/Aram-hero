// 把每个符文要用的 CDragon 图标下载到 public/augment-icons/，网站以后直接用本地图
// 用法（在项目根目录运行）：node download-icons.mjs
// 已经下载过的会跳过，可以放心重复运行
import fs from 'node:fs';
import path from 'node:path';

const CDRAGON = 'https://raw.communitydragon.org/latest/game/assets/ux/cherry/augments/icons/';
const DIR = './public/augment-icons';
const DATA = './data/augments.json';

fs.mkdirSync(DIR, {recursive: true});
const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const shown = data.filter((a) => !a.disabled);

// 下载一张图，失败自动重试 3 次
async function download(code) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${CDRAGON}${code}_large.png`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(String(res.status));
      return Buffer.from(await res.arrayBuffer());
    } catch {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}

const failed = [];
let saved = 0, skipped = 0, keptShape = 0;

// 每次 5 个，慢一点但稳
for (let i = 0; i < shown.length; i += 5) {
  await Promise.all(shown.slice(i, i + 5).map(async (a) => {
    const file = `${a.id}.png`;
    const target = path.join(DIR, file);

    if (fs.existsSync(target)) { a.iconLocal = `/augment-icons/${file}`; skipped++; return; }

    // 先下自己的图，没有就下替身图
    for (const code of [a.icon, a.iconAlt]) {
      if (!code) continue;
      const buf = await download(code);
      if (buf) {
        fs.writeFileSync(target, buf);
        a.iconLocal = `/augment-icons/${file}`;
        saved++;
        return;
      }
    }

    // CDragon 上没有：如果之前已经有形状图（你从 Wiki 下的），就继续用它
    if (a.iconLocal && fs.existsSync(`./public${a.iconLocal}`)) { keptShape++; return; }
    failed.push(a);
  }));
  process.stdout.write(`\r已处理 ${Math.min(i + 5, shown.length)}/${shown.length}`);
}

fs.writeFileSync(DATA, JSON.stringify(data, null, 2), 'utf8');

console.log(`\n新下载 ${saved} 张，已存在跳过 ${skipped} 张，用 Wiki 形状图 ${keptShape} 个`);
if (failed.length) {
  console.log(`下载失败 ${failed.length} 个，稍后再运行一次试试：`);
  failed.forEach((a) => console.log(`  ${a.name.zh} / ${a.name.en}`));
} else {
  console.log('全部完成，augments.json 已更新');
}
