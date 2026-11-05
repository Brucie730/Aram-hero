'use client';

import {useState, useRef, useEffect} from 'react';
import {useRouter, usePathname} from 'next/navigation';
import {useLocale} from 'next-intl';

const languages = [
  {code: 'en', label: 'English'},
  {code: 'zh', label: '中文'},
  {code: 'es', label: 'Español'},
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  // isOpen: 下拉菜单是打开还是关闭的状态，false = 默认关闭
  const [isOpen, setIsOpen] = useState(false);

  // menuRef: 用来"记住"这个组件的 DOM 节点，方便下面判断"用户是不是点了外面"
  const menuRef = useRef(null);

  const current = languages.find((lang) => lang.code === currentLocale);

  function handleChange(newLocale) {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
    setIsOpen(false); // 选完之后自动收起菜单
  }

  // 监听"点击页面任何地方"，如果点的地方不在这个组件范围内，就自动关闭菜单
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    // 组件卸载时清理这个监听，避免内存泄漏（React的固定套路）
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      {/* 主按钮：显示当前语言 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 text-white text-sm hover:bg-slate-700 transition"
      >
        {current?.label}
        <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* 下拉菜单：isOpen 为 true 才渲染，false 的话这部分完全不存在 */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-slate-700 rounded shadow-lg overflow-hidden">
          {languages
            .filter((lang) => lang.code !== currentLocale) // 当前语言不用再显示在选项里
            .map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleChange(lang.code)}
                className="block w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
              >
                {lang.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}