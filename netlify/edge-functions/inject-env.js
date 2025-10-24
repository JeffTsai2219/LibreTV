// Netlify Edge Function - 个人站点不注入密码信息
export default async (request, context) => {
  return context.next();
};

export const config = {
  path: ["/*"]
};
