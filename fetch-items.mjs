// 拉取所有商店装备的中英文名，并把图标下载到 public/item-icons/，生成 data/items.json
// 用法（在项目根目录运行）：node fetch-items.mjs
// 新版本出新装备时再跑一次，已下载的图标会跳过
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global';
const ICON_DIR = './public/item-icons';
fs.mkdirSync(ICON_DIR, {recursive: true});

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下载失败 ${res.status}：${url}`);
  return res.json();
}

console.log('正在下载装备列表…');
const [en, zh] = await Promise.all([
  getJson(`${BASE}/default/v1/items.json`),
  getJson(`${BASE}/zh_cn/v1/items.json`),
]);
const zhById = new Map(zh.map((i) => [i.id, i]));

// 只要商店里能买的普通装备（去掉英雄专属、其他模式的变体）
const items = en
  .filter((i) => i.inStore !== false && i.priceTotal > 0 && !i.requiredChampion && i.id < 10000 && i.iconPath)
  .map((i) => ({
    id: i.id,
    name: {en: i.name, zh: zhById.get(i.id)?.name || i.name},
    price: i.priceTotal,
    // iconPath 形如 /lol-game-data/assets/ASSETS/Items/Icons2D/xxx.png，换成 CDragon 的下载地址
    iconUrl: `${BASE}/default/${i.iconPath.replace('/lol-game-data/assets/', '').toLowerCase()}`,
    icon: `/item-icons/${i.id}.png`,
  }))
  .sort((a, b) => a.id - b.id);

// 下载图标，每次 5 个，失败重试
async function download(url, target) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()));
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return false;
}

let saved = 0;
const failed = [];
for (let i = 0; i < items.length; i += 5) {
  await Promise.all(items.slice(i, i + 5).map(async (it) => {
    const target = path.join(ICON_DIR, `${it.id}.png`);
    if (fs.existsSync(target)) return;
    if (await download(it.iconUrl, target)) saved++;
    else failed.push(it);
  }));
  process.stdout.write(`\r图标 ${Math.min(i + 5, items.length)}/${items.length}`);
}

fs.writeFileSync('./data/items.json', JSON.stringify(items.map(({iconUrl, ...rest}) => rest), null, 2), 'utf8');
console.log(`\n完成：${items.length} 件装备，新下载图标 ${saved} 张，已写入 data/items.json`);
if (failed.length) console.log(`图标下载失败 ${failed.length} 个，稍后再运行一次：${failed.map((i) => i.name.en).join(', ')}`);

// 检查 combos.json 里的装备名能不能对上
if (fs.existsSync('./data/combos.json')) {
  const byName = new Map(items.map((i) => [i.name.en.toLowerCase(), i]));
  const combos = JSON.parse(fs.readFileSync('./data/combos.json', 'utf8'));
  const missing = [...new Set(combos.flatMap((c) => c.items).filter((it) => !byName.has(it.en.toLowerCase())).map((it) => `${it.zh} / ${it.en}`))];
  console.log(missing.length ? `套路里这些装备没对上，英文名要改：${missing.join('；')}` : '套路里的装备全部对上了');
}
