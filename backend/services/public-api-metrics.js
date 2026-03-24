import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";

function toNumber(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "bigint") return Number(v);
  return Number(v);
}

function buildWhereSql({ organizationId, keyId, since }) {
  if (keyId) {
    return Prisma.sql`WHERE organization_id = ${organizationId} AND public_api_key_id = ${keyId} AND created_at >= ${since}`;
  }
  return Prisma.sql`WHERE organization_id = ${organizationId} AND created_at >= ${since}`;
}

export async function getPublicApiMetrics({ organizationId, keyId = null, days = 7 }) {
  const safeDays = Math.max(1, Math.min(90, Number(days) || 7));
  const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);
  const bucket = safeDays <= 3 ? "hour" : "day";
  const bucketSql = bucket === "hour" ? Prisma.sql`hour` : Prisma.sql`day`;
  const where = buildWhereSql({ organizationId, keyId, since });

  const [totalsRows, statusRows, endpointRows, timeRows, errorRows, keyRows] = await Promise.all([
    prisma.$queryRaw(
      Prisma.sql`
        SELECT
          COUNT(*)::bigint AS total_requests,
          COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300)::bigint AS successful_requests,
          COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500)::bigint AS client_errors,
          COUNT(*) FILTER (WHERE status_code >= 500)::bigint AS server_errors,
          ROUND(AVG(duration_ms)::numeric, 2) AS avg_duration_ms,
          percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms) AS p50_duration_ms,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_duration_ms
        FROM public_api_requests
        ${where}
      `
    ),
    prisma.$queryRaw(
      Prisma.sql`
        SELECT
          status_code,
          COUNT(*)::bigint AS request_count
        FROM public_api_requests
        ${where}
        GROUP BY status_code
        ORDER BY request_count DESC
      `
    ),
    prisma.$queryRaw(
      Prisma.sql`
        SELECT
          method,
          path,
          COUNT(*)::bigint AS request_count,
          COUNT(*) FILTER (WHERE status_code >= 400)::bigint AS error_count,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_duration_ms
        FROM public_api_requests
        ${where}
        GROUP BY method, path
        ORDER BY request_count DESC
        LIMIT 8
      `
    ),
    prisma.$queryRaw(
      Prisma.sql`
        SELECT
          date_trunc(${bucketSql}, created_at) AS bucket_start,
          COUNT(*)::bigint AS request_count,
          COUNT(*) FILTER (WHERE status_code >= 400)::bigint AS error_count,
          ROUND(AVG(duration_ms)::numeric, 2) AS avg_duration_ms
        FROM public_api_requests
        ${where}
        GROUP BY bucket_start
        ORDER BY bucket_start ASC
      `
    ),
    prisma.$queryRaw(
      Prisma.sql`
        SELECT
          COALESCE(error_code, 'unknown') AS error_code,
          COUNT(*)::bigint AS request_count
        FROM public_api_requests
        ${where}
        AND status_code >= 400
        GROUP BY COALESCE(error_code, 'unknown')
        ORDER BY request_count DESC
        LIMIT 8
      `
    ),
    keyId
      ? Promise.resolve([])
      : prisma.$queryRaw(
          Prisma.sql`
            SELECT
              r.public_api_key_id,
              k.name,
              k.key_prefix,
              COUNT(*)::bigint AS request_count
            FROM public_api_requests r
            JOIN public_api_keys k ON k.id = r.public_api_key_id
            ${where}
            GROUP BY r.public_api_key_id, k.name, k.key_prefix
            ORDER BY request_count DESC
            LIMIT 6
          `
        ),
  ]);

  const totals = totalsRows[0] || {};
  const totalRequests = toNumber(totals.total_requests);
  const successfulRequests = toNumber(totals.successful_requests);
  const clientErrors = toNumber(totals.client_errors);
  const serverErrors = toNumber(totals.server_errors);

  return {
    window_days: safeDays,
    bucket,
    from: since.toISOString(),
    to: new Date().toISOString(),
    totals: {
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      client_errors: clientErrors,
      server_errors: serverErrors,
      success_rate: totalRequests ? Number(((successfulRequests / totalRequests) * 100).toFixed(2)) : 0,
      avg_duration_ms: toNumber(totals.avg_duration_ms),
      p50_duration_ms: toNumber(totals.p50_duration_ms),
      p95_duration_ms: toNumber(totals.p95_duration_ms),
    },
    by_status_code: statusRows.map((r) => ({
      status_code: toNumber(r.status_code),
      request_count: toNumber(r.request_count),
      percentage: totalRequests ? Number(((toNumber(r.request_count) / totalRequests) * 100).toFixed(2)) : 0,
    })),
    top_endpoints: endpointRows.map((r) => ({
      method: r.method,
      path: r.path,
      request_count: toNumber(r.request_count),
      error_count: toNumber(r.error_count),
      error_rate: toNumber(r.request_count)
        ? Number(((toNumber(r.error_count) / toNumber(r.request_count)) * 100).toFixed(2))
        : 0,
      p95_duration_ms: toNumber(r.p95_duration_ms),
    })),
    timeseries: timeRows.map((r) => ({
      bucket_start: r.bucket_start?.toISOString?.() ?? r.bucket_start,
      request_count: toNumber(r.request_count),
      error_count: toNumber(r.error_count),
      avg_duration_ms: toNumber(r.avg_duration_ms),
    })),
    error_codes: errorRows.map((r) => ({
      code: r.error_code,
      request_count: toNumber(r.request_count),
    })),
    top_keys: keyRows.map((r) => ({
      key_id: r.public_api_key_id,
      name: r.name,
      key_prefix: r.key_prefix,
      request_count: toNumber(r.request_count),
    })),
  };
}
