/**
 * Backfill revenue share fields on legacy purchases:
 * purchases completed before the split existed have no feePercent/platformFee/teacherEarning.
 * This script computes them retroactively (idempotent — skips purchases already backfilled).
 *
 * Usage: node scripts/backfill-earnings.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function getPlatformFeePercent() {
  const raw = Number(process.env.PLATFORM_FEE_PERCENT ?? "20");
  if (Number.isNaN(raw) || raw < 0 || raw > 100) return 20;
  return raw;
}

async function main() {
  const feePercent = getPlatformFeePercent();
  console.log(`Using PLATFORM_FEE_PERCENT = ${feePercent}%`);

  // NOTE: with Prisma + MongoDB, a `field: null` filter does NOT match
  // documents where the field is missing — so we fetch all completed
  // purchases and skip already-backfilled ones in JS instead.
  const purchases = await prisma.purchase.findMany({
    where: {
      paymentStatus: "completed",
    },
    include: { course: { select: { price: true } } },
  });

  const pending = purchases.filter((p) => p.teacherEarning == null);
  console.log(`Found ${purchases.length} completed purchase(s), ${pending.length} need backfill.`);

  let updated = 0;
  for (const purchase of pending) {
    if (purchase.teacherEarning != null) continue; // idempotent — skip already backfilled
    const amount = purchase.amount ?? purchase.course?.price ?? 0;
    const platformFee = Math.round(amount * feePercent) / 100;
    const teacherEarning = Math.round((amount - platformFee) * 100) / 100;

    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { amount, feePercent, platformFee, teacherEarning },
    });
    updated++;
  }

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());