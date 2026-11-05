// 按页面的找图顺序检查每个符文，列出最后还是显示灰色方块的
// 用法（在项目根目录运行）：node check-icons.mjs
import fs from 'node:fs';

const CDRAGON = 'https://raw.communitydragon.org/latest/game/assets/ux/cherry/augments/icons/';
const data = JSON.parse(fs.readFileSync('./data/augments.json', 'utf8'));
const shown = data.filter((a) => !a.disabled);

const cache = new Map();
async function cdragonOk(code) {
  if (!code) return false;
  if (!cache.has(code)) {
    cache.set(code, fetch(`${CDRAGON}${code}_large.png`, {method: 'HEAD'})
      .then((r) => r.ok).catch(() => false));
  }
  return cache.get(code);
}

const gray = [];
const viaAlt = [];
const viaLocal = [];

for (let i = 0; i < shown.length; i += 10) {
  await Promise.all(shown.slice(i, i + 10).map(async (a) => {
    if (await cdragonOk(a.icon)) return;
    if (await cdragonOk(a.iconAlt)) { viaAlt.push(a); return; }
    if (a.iconLocal && fs.existsSync(`./public${a.iconLocal}`)) { viaLocal.push(a); return; }
    gray.push(a);
  }));
  process.stdout.write(`\r已检查 ${Math.min(i + 10, shown.length)}/${shown.length}`);
}

const label = {silver: '银', gold: '金', prismatic: '棱彩'};
const row = (a) => `| ${a.name.zh} | ${a.name.en} | ${label[a.rarity]} | ${a.shape} | ${a.icon || '-'} | ${a.iconAlt || '-'} | ${a.iconLocal || '-'} |`;
const head = ['| 中文名 | 英文名 | 稀有度 | 形状 | icon | iconAlt | iconLocal |', '|---|---|---|---|---|---|---|'];

const lines = [
  '# 图标检查结果',
  '',
  `自己的图 ${shown.length - viaAlt.length - viaLocal.length - gray.length} 个，借用替身图 ${viaAlt.length} 个，用本地图 ${viaLocal.length} 个，灰色方块 ${gray.length} 个`,
  '',
  '## 灰色方块', '', ...head, ...gray.map(row), '',
  '## 借用替身图（哪个形状看着不对就告诉我）', '', ...head, ...viaAlt.map(row), '',
];
fs.writeFileSync('./icon-report.md', lines.join('\n'), 'utf8');
console.log(`\n灰色方块 ${gray.length} 个，详细结果在 icon-report.md`);
