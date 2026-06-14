import { getProtectedResourceMetadataResponse } from '../metadata';

export async function GET(): Promise<Response> {
  return getProtectedResourceMetadataResponse();
}
