const { Sequelize } = require('sequelize');

const url = process.argv[2] || process.env.DATABASE_URL;
if (!url) {
  console.error('No DATABASE_URL provided');
  process.exit(1);
}

const sequelize = new Sequelize(url, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
});

async function main() {
  await sequelize.authenticate();
  console.log('DB: connected OK');

  const [tables] = await sequelize.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
  );
  console.log('Tables:', tables.map((t) => t.table_name).join(', '));

  const [adsStats] = await sequelize.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE images IS NOT NULL AND array_length(images, 1) > 0)::int AS with_images,
      COUNT(*) FILTER (WHERE images IS NULL OR array_length(images, 1) IS NULL)::int AS without_images
    FROM "Ads"
  `);
  console.log('Ads stats:', adsStats[0]);

  const [ads] = await sequelize.query(`
    SELECT id, title, array_length(images, 1) AS img_count, images[1] AS first_image
    FROM "Ads"
    ORDER BY id DESC
    LIMIT 10
  `);
  console.log('\nRecent ads:');
  for (const ad of ads) {
    console.log(` - #${ad.id} | ${(ad.title || '').slice(0, 40)} | imgs: ${ad.img_count || 0}`);
    if (ad.first_image) console.log(`   ${ad.first_image}`);
  }

  const [users] = await sequelize.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE avatar IS NOT NULL AND avatar <> '')::int AS with_avatar
    FROM "Users"
  `);
  console.log('\nUsers avatar stats:', users[0]);

  const [avatars] = await sequelize.query(`
    SELECT id, avatar FROM "Users"
    WHERE avatar IS NOT NULL AND avatar <> ''
    LIMIT 5
  `);
  if (avatars.length) {
    console.log('Sample avatars:');
    avatars.forEach((u) => console.log(` - user #${u.id}: ${u.avatar}`));
  }

  const [msgs] = await sequelize.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "imageUrl" IS NOT NULL AND "imageUrl" <> '')::int AS with_image
    FROM "Messages"
  `);
  console.log('\nMessages image stats:', msgs[0]);

  const [patterns] = await sequelize.query(`
    SELECT
      CASE
        WHEN images[1] LIKE '%supabase.co/storage%' THEN 'supabase-storage'
        WHEN images[1] LIKE 'http%' THEN 'other-http'
        WHEN images[1] LIKE '/uploads/%' THEN 'local-uploads'
        WHEN images[1] IS NULL THEN 'empty'
        ELSE 'other'
      END AS pattern,
      COUNT(*)::int AS cnt
    FROM "Ads"
    GROUP BY 1
    ORDER BY cnt DESC
  `);
  console.log('\nAd image URL patterns:', patterns);

  await sequelize.close();
}

main().catch((err) => {
  console.error('ERR:', err.message);
  process.exit(1);
});
