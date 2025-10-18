import { NextRequest, NextResponse } from 'next/server';
import { wardrobeServicePromise } from '@/services/wardrobe/items.service';
import { CreateWardrobeItemDto } from '@/packages/types/src/wardrobe';

/**
 * @swagger
 * /api/wardrobe/items:
 *   get:
 *     summary: Get wardrobe items for a user
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of wardrobe items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WardrobeItem'
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'userId is required' }, { status: 400 });
    }

    const wardrobeService = await wardrobeServicePromise;
    const items = wardrobeService.getItems(userId);

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching wardrobe items:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/wardrobe/items:
 *   post:
 *     summary: Create a new wardrobe item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWardrobeItemDto'
 *     responses:
 *       201:
 *         description: The created wardrobe item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WardrobeItem'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // The DTO might be nested under a userId property, handle both cases
    const { userId, ...itemData } = body.userId ? body : { userId: body.userId, ...body };

    if (!userId || !itemData.name || !itemData.type) {
      return NextResponse.json({ message: 'userId, name, and type are required' }, { status: 400 });
    }

    const wardrobeService = await wardrobeServicePromise;
    const newItem = await wardrobeService.createItem(userId, itemData as CreateWardrobeItemDto);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating wardrobe item:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
