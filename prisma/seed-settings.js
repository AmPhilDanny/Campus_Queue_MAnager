import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const settings = [
    { key: "campus_name", value: "FhinovaxSmartQM" },
    { key: "primary_color", value: "#1e3a8a" },
    { key: "secondary_color", value: "#ffffff" },
    { key: "logo_text", value: "FSQM" },
    { key: "display_mode", value: "both" },
    { key: "font_family", value: "Inter" },
    { key: "footer_col1_title", value: "Quick Links" },
    { key: "footer_col1_links", value: '[{"label":"Home","url":"/"},{"label":"Admin","url":"/admin/login"}]' },
    { key: "footer_col2_title", value: "Our Offices" },
    { key: "footer_col2_links", value: '[]' },
    { key: "footer_col3_title", value: "Resources" },
    { key: "footer_col3_links", value: '[{"label":"Help Center","url":"#"}]' },
    { key: "footer_col4_title", value: "Contact Us" },
    { key: "footer_address", value: "123 Smart Way, Business District" },
    { key: "footer_socials", value: '{"facebook":"#","twitter":"#","instagram":"#","linkedin":"#"}' },
    { key: "footer_copyright", value: "© 2026 FhinovaxSmartQM. All rights reserved." },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log("Settings seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
