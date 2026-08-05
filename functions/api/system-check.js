export async function onRequestGet(context) {
  const result = {
    success: false,
    database: {
      connected: false,
    },
    storage: {
      connected: false,
    },
  };

  try {
    const databaseCheck = await context.env.DB
      .prepare("SELECT 1 AS value")
      .first();

    result.database = {
      connected: databaseCheck?.value === 1,
    };
  } catch (error) {
    result.database = {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    const storageCheck = await context.env.MEDIA.list({
      limit: 1,
    });

    result.storage = {
      connected: true,
      objectsFound: storageCheck.objects.length,
    };
  } catch (error) {
    result.storage = {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  result.success =
    result.database.connected === true &&
    result.storage.connected === true;

  return new Response(JSON.stringify(result, null, 2), {
    status: result.success ? 200 : 500,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
