'use client';

import {useState, useRef, useEffect} from 'react';

const CDRAGON = 'https://raw.communitydragon.org/latest/game/assets/ux/cherry/augments/icons/';

// 按顺序排出这个符文可以尝试的图片：
// 1. 自己的 CDragon 图标  2. 同形状同颜色的替身图标（iconAlt）  3. 本地下载的形状图标  4. 都不行就显示灰色方块
function getSources(augment) {
  const list = [];
  if (augment.icon) list.push(`${CDRAGON}${augment.icon}_large.png`);
  if (augment.iconAlt) list.push(`${CDRAGON}${augment.iconAlt}_large.png`);
  if (augment.iconLocal) list.push(augment.iconLocal);
  return list;
}

export default function AugmentIcon({augment, alt, className = 'w-10 h-10 rounded flex-shrink-0'}) {
  const sources = getSources(augment);
  const [index, setIndex] = useState(0);
  const imgRef = useRef(null);

  // 加载失败就换下一张
  function handleError() {
    setIndex((i) => i + 1);
  }

  // 补漏：图片可能在 React 接管页面之前就已经失败了，主动检查一次
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) handleError();
  }, [index]);

  if (index >= sources.length) {
    return <div className={`${className} bg-slate-700`} aria-label={alt} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={sources[index]}
      ref={imgRef}
      src={sources[index]}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}