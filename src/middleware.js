import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // 匹配所有网址路径，除了 api、静态文件、Next.js内部文件
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};