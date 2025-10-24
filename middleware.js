// Vercel Middleware - 个人站点无需注入密码，直接透传响应
export default function middleware(request) {
  return fetch(request);
}

export const config = {
  matcher: ['/', '/((?!api|_next/static|_vercel|favicon.ico).*)'],
};
