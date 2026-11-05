// 把从 Wiki 下载的图标改成网站要的名字，并把 augments.json 里的本地图路径改成 .webp
// 用法（在项目根目录运行）：node rename-icons.mjs
import fs from 'node:fs';
import path from 'node:path';

const DIR = './public/augment-icons';
const DATA = './data/augments.json';

// Wiki 文件名里的符文名 → 网站要的文件名（不含后缀）
const MAP = {
  'Flash_2': 'trident-silver',
  'BONK!': 'shard-silver',
  'Hands_off_the_Talent': 'shard-silver',
  'Scoped_Weapons': 'arrow-silver',
  'Stackosaurus_Rex': 'up-arrow-silver',
  'Ultimate_Unstoppable': 'cross-slash-silver',
  'Growth_Spurt': 'people-gold',
  'Heavy_Is_The_Crown': 'eye-gold',
  'Shark_Bait': 'broken-heart-gold',
  'Clown_College': 'mask-prismatic',
  'Cruelty': 'cauldron-prismatic',
  'Empowered_By_The_Faithful': 'people-prismatic',
  'Hellbent': 'shield-prismatic',
  'Infernal_Conduit': 'fire-prismatic',
  'Scopiest_Weapons': 'arrow-prismatic',
  'Spirit_Bomb': 'heart-prismatic',
};

// 1. 改文件名
const files = fs.readdirSync(DIR);
for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  const m = file.match(/^\d+px-(.+?)_mayhem_augment\.\w+$/i);
  if (!m) continue;
  const target = MAP[m[1]];
  if (!target) {
    console.log(`没认出来，跳过：${file}`);
    continue;
  }
  fs.renameSync(path.join(DIR, file), path.join(DIR, `${target}${ext}`));
  console.log(`${file}  →  ${target}${ext}`);
}

// 2. 按文件夹里实际存在的文件，更新 augments.json 里的本地图路径（.png 或 .webp 都认）
const have = new Set(fs.readdirSync(DIR));
const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
let updated = 0;
for (const a of data) {
  if (!a.iconLocal) continue;
  const base = path.basename(a.iconLocal).replace(/\.\w+$/, '');
  const found = ['.webp', '.png'].map((e) => base + e).find((f) => have.has(f));
  if (found && a.iconLocal !== `/augment-icons/${found}`) {
    a.iconLocal = `/augment-icons/${found}`;
    updated++;
  }
}
fs.writeFileSync(DATA, JSON.stringify(data, null, 2), 'utf8');
console.log(`\naugments.json 更新了 ${updated} 个本地图路径`);

// 3. 看看还缺哪张
const needed = [...new Set(data.filter((a) => a.iconLocal && !a.disabled).map((a) => path.basename(a.iconLocal).replace(/\.\w+$/, '')))];
const stillMissing = needed.filter((b) => !have.has(`${b}.webp`) && !have.has(`${b}.png`));
console.log(stillMissing.length ? `还缺：${stillMissing.join(', ')}` : '15 张全齐了');
