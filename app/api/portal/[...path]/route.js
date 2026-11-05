import { handlePortalRequest } from '../../../../src/server/portalProxy.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, context) {
  const { path } = await context.params;
  return handlePortalRequest(request, path);
}
export async function POST(request, context) {
  const { path } = await context.params;
  return handlePortalRequest(request, path);
}
