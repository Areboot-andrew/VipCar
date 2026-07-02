import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const blocks = await prisma.pageBlock.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(blocks);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch blocks' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Create new block
    const maxOrderBlock = await prisma.pageBlock.findFirst({
      orderBy: { order: 'desc' }
    });
    
    const nextOrder = maxOrderBlock ? maxOrderBlock.order + 1 : 0;
    
    const newBlock = await prisma.pageBlock.create({
      data: {
        type: data.type,
        content: data.content || '{}',
        order: nextOrder,
        active: true,
      }
    });
    
    return NextResponse.json(newBlock);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create block' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    
    // Update multiple blocks (for reordering or batch save)
    if (Array.isArray(data)) {
      for (const block of data) {
        await prisma.pageBlock.update({
          where: { id: block.id },
          data: {
            order: block.order,
            content: block.content,
            active: block.active
          }
        });
      }
      return NextResponse.json({ success: true });
    }
    
    // Single update
    const updated = await prisma.pageBlock.update({
      where: { id: data.id },
      data: {
        content: data.content,
        active: data.active
      }
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update blocks' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    await prisma.pageBlock.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
