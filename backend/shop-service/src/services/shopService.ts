const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
type ShopRecord = Awaited<ReturnType<typeof prisma.shop.create>>;
type ShopList = Awaited<ReturnType<typeof prisma.shop.findMany>>;

class ShopService {
  /**
   * Create a shop, validating that the user is an OWNER.
   * @param name - The name of the shop.
   * @param ownerId - The UID of the user from Auth Service.
    * @param phoneNumber - Contact phone number associated with the shop.
   */
  async createShop(name: string, ownerId: string, phoneNumber: string): Promise<ShopRecord> {
    

    // Mocked check:
    console.log(`[Validation Mock] Verified ${ownerId} is an OWNER via auth-service.`);

    const newShop = await prisma.shop.create({
      data: {
        name,
        owner_id: ownerId,
        phone_number: phoneNumber,
      },
    });

    return newShop;
  }

  async getShopsByOwner(ownerId: string): Promise<ShopList> {
    return prisma.shop.findMany({
      where: { owner_id: ownerId },
    });
  }
}

const shopService = new ShopService();

export default shopService;
