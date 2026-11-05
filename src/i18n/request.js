import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

// 每次页面请求时，决定用哪个语言的翻译文件
export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  // 如果网址里的语言代码不在我们支持的列表里，就退回默认语言
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // 根据语言动态加载对应的翻译文件，比如 messages/zh.json
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});