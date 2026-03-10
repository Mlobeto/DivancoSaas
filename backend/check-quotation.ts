import prisma from "./src/config/database";

async function main() {
  const quotation = await prisma.quotation.findFirst({
    where: { code: "QU-2026-001" },
    select: {
      code: true,
      taxRate: true,
      termsAndConditions: true,
      quotationType: true,
      items: {
        select: {
          description: true,
          quantity: true,
          unitPrice: true,
          pricePerDay: true,
          pricePerWeek: true,
          pricePerMonth: true,
          selectedPeriods: true,
        },
      },
    },
  });

  console.log(JSON.stringify(quotation, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
