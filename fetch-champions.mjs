// 自动拉取所有英雄的三语名字、头像和近战/远程，生成 data/champions.json
// 用法（在项目根目录运行）：node fetch-champions.mjs
// 以后出新英雄，再跑一次就行
import fs from 'node:fs';

const CDRAGON = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global';
const DDRAGON = 'https://ddragon.leagueoflegends.com';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下载失败 ${res.status}：${url}`);
  return res.json();
}

console.log('正在下载英雄列表…');

// 1. Community Dragon：英雄列表（英文、中文、西班牙文）
const [en, zh, es] = await Promise.all([
  getJson(`${CDRAGON}/default/v1/champion-summary.json`),
  getJson(`${CDRAGON}/zh_cn/v1/champion-summary.json`),
  getJson(`${CDRAGON}/es_es/v1/champion-summary.json`),
]);
const zhById = new Map(zh.map((c) => [c.id, c]));
const esById = new Map(es.map((c) => [c.id, c]));

// 2. Riot 官方 Data Dragon：攻击距离（判断近战/远程）和中文称号
const versions = await getJson(`${DDRAGON}/api/versions.json`);
const v = versions[0];
const [ddEn, ddZh] = await Promise.all([
  getJson(`${DDRAGON}/cdn/${v}/data/en_US/champion.json`),
  getJson(`${DDRAGON}/cdn/${v}/data/zh_CN/champion.json`),
]);
const ddEnByKey = new Map(Object.values(ddEn.data).map((c) => [Number(c.key), c]));
const ddZhByKey = new Map(Object.values(ddZh.data).map((c) => [Number(c.key), c]));

// 3. 合并
const champions = en
  // 只保留官方 Data Dragon 里也有的英雄，去掉 CDragon 里混进来的人机、活动变体等
  .filter((c) => c.id > 0 && ddEnByKey.has(c.id))
  .map((c) => {
    const dd = ddEnByKey.get(c.id);
    const ddz = ddZhByKey.get(c.id);
    const range = dd?.stats?.attackrange ?? null;
    // 中文里英雄有「名字」和「称号」两种叫法（比如 亚托克斯 / 暗裔剑魔），两个都存，搜索时都能搜到
    const zhNames = [...new Set([zhById.get(c.id)?.name, ddz?.name, ddz?.title].filter(Boolean))];
    return {
      id: c.alias.toLowerCase(),
      key: c.id,
      name: {
        en: c.name,
        zh: zhNames[0] || c.name,
        es: esById.get(c.id)?.name || c.name,
      },
      zhAlt: zhNames.slice(1),
      icon: `${CDRAGON}/default/v1/champion-icons/${c.id}.png`,
      ranged: range !== null ? range > 300 : null,
      attackRange: range,
      roles: c.roles || [],
    };
  })
  .sort((a, b) => a.name.en.localeCompare(b.name.en));

fs.writeFileSync('./data/champions.json', JSON.stringify(champions, null, 2), 'utf8');

// 4. 汇报
const ranged = champions.filter((c) => c.ranged === true).length;
const melee = champions.filter((c) => c.ranged === false).length;
const unknown = champions.filter((c) => c.ranged === null);
console.log(`完成：${champions.length} 个英雄（远程 ${ranged}，近战 ${melee}）`);
console.log(`游戏版本 ${v}，已写入 data/champions.json`);
if (unknown.length) {
  console.log(`这些英雄 Data Dragon 里还没有攻击距离，近战/远程要手动确认：${unknown.map((c) => c.name.en).join(', ')}`);
}
console.log('提示：变身类英雄（豹女、蜘蛛、杰斯、纳尔等）按默认形态判断，用的时候注意一下');
