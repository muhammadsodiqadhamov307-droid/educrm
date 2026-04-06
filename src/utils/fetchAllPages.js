/**
 * @template T
 * @param {(params?: Record<string, unknown>) => Promise<{ data: { results?: T[], next?: string | null } }>} request
 * @param {Record<string, unknown>} [params]
 * @returns {Promise<T[]>}
 */
export async function fetchAllPages(request, params = {}) {
  let page = 1;
  let next = true;
  const results = [];

  while (next) {
    const { data } = await request({ ...params, page });
    results.push(...(data.results || []));
    next = Boolean(data.next);
    page += 1;
  }

  return results;
}
