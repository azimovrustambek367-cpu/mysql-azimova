import mysql from "mysql2/promise";

async function getDb() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  });
}

export default async (req) => {
  const db = await getDb();

  try {
    if (req.method === "POST") {
      const body = await req.json();

      if (body.action === "like" && body.id) {
        // like bosilganda faqat shu yozuvning likes sonini +1 qilamiz
        const id = Number(body.id);
        if (Number.isInteger(id)) {
          await db.execute("UPDATE fikrlar SET likes = likes + 1 WHERE id = ?", [id]);
        }
      } else {
        // yangi ism + fikr qo'shish
        const name = String(body.name ?? "").trim().slice(0, 100);
        const comment = String(body.comment ?? "").trim().slice(0, 500);
        if (name && comment) {
          await db.execute(
            "INSERT INTO fikrlar (name, comment) VALUES (?, ?)",
            [name, comment]
          );
        }
      }
    }

    // har doim eng oxirgi fikrlar ro'yxatini qaytaramiz
    const [rows] = await db.execute(
      "SELECT id, name, comment, likes, created_at FROM fikrlar ORDER BY id DESC LIMIT 200"
    );
    return Response.json(rows);
  } catch (err) {
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  } finally {
    await db.end();
  }
};
