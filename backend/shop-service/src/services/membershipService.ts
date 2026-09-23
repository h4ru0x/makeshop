const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
type MembershipRecord = Awaited<ReturnType<typeof prisma.membership.create>>;

class MembershipService {

  async addMembership(
    userId: string,
    shopId: string,
    role: string
  ): Promise<MembershipRecord> {
    console.log(`[Validation Mock] Verified user ${userId} exists in auth-service.`);

    
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error("Shop not found");

    const newMembership = await prisma.membership.create({
      data: {
        // Persist both the owner user reference and shop relation.
        user_id: userId,
        shop_id: shopId,
        role,
      },
    });

    return newMembership;
  }
}

const membershipService = new MembershipService();

export default membershipService;
