// Dev script: logs in and creates sample news with local images
// Usage: node scripts/create-news-fixtures.mjs

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sakhu.org";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  if (!data?.token) throw new Error("No token in login response");
  return data.token;
}

async function createNews(token, item) {
  const res = await fetch(`${BASE_URL}/api/news`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create failed (${item.title}): ${res.status} ${text}`);
  }
  return res.json();
}

async function main() {
  try {
    console.log(`Logging in at ${BASE_URL} as ${ADMIN_EMAIL} ...`);
    const token = await login();
    console.log("Login OK");

    const now = new Date();
    const samples = [
      {
        title: `Community Update ${now.toLocaleString()}`,
        summary: "Quick highlights from the week",
        content: "<p>This is a sample news item to validate cards and images.</p>",
        heroImageUrl: "/next.svg",
        published: true,
      },
      {
        title: "Volunteer Spotlight",
        summary: "Celebrating contributions",
        content: "<p>Shining a light on volunteers and their impact.</p>",
        heroImageUrl: "/globe.svg",
        published: true,
      },
      {
        title: "Upcoming Events",
        summary: "Mark your calendars",
        content: "<p>Dont miss our upcoming activities and sessions.</p>",
        heroImageUrl: "/window.svg",
        published: true,
      },
    ];

    for (const item of samples) {
      const created = await createNews(token, item);
      console.log(`Created: id=${created?.id} title="${created?.title}"`);
    }

    console.log("All sample news created.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
