const INSERT_SQL = `
  INSERT INTO generated_names (
    keywords,
    name,
    meaning,
    inspiration,
    score,
    memorability,
    brandability,
    professionalism
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  console.log('[save-name] Request received.');

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request' }, 400);
  }

  console.log('[save-name] Parsed request body:', body);

  const keywords = body?.keywords;
  const names = body?.names;

  console.log('[save-name] Number of names:', Array.isArray(names) ? names.length : 0);

  if (keywords == null || String(keywords).trim() === '') {
    return jsonResponse({ error: 'Keywords required' }, 400);
  }

  if (!Array.isArray(names)) {
    return jsonResponse({ error: 'Names array required' }, 400);
  }

  console.log('[save-name] env.DB exists:', !!env.DB);

  if (!env.DB) {
    return jsonResponse({ error: 'Database not configured' }, 500);
  }

  const keywordsStr = String(keywords).trim();

  try {
    const statements = [];

    for (const item of names) {
      const name = String(item?.name ?? '').trim();
      if (!name) {
        return jsonResponse({ error: 'Each name entry must include a non-empty name' }, 400);
      }

      const score = item?.score == null ? null : Number(item.score);

      statements.push(
        env.DB.prepare(INSERT_SQL).bind(
          keywordsStr,
          name,
          String(item?.meaning ?? ''),
          String(item?.inspiration ?? ''),
          Number.isFinite(score) ? score : null,
          String(item?.memorability ?? ''),
          String(item?.brandability ?? ''),
          String(item?.professionalism ?? '')
        )
      );
    }

    if (statements.length > 0) {
      console.log('[save-name] Before batch insert.');
      await env.DB.batch(statements);
      console.log('[save-name] After successful batch insert.');
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('[save-name] Failed to save names:', error);
    return jsonResponse({ error: 'Failed to save names' }, 500);
  }
}
