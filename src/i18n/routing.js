import {defineRouting} from 'next-intl/routing';

// 定义支持哪些语言、默认语言是哪个
export const routing = defineRouting({
  locales: ['en', 'zh', 'es'],   // 支持的语言列表：英/中/西
  defaultLocale: 'en'            // 默认语言：英文
});