const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  try {
    const u = await prisma.user.findFirst({
      where: { email: "Owner@Owner.com" },
    });
    console.log("result", u);
  } catch (err) {
    console.error("error", err);
  } finally {
    await prisma.$disconnect();
  }
})();
