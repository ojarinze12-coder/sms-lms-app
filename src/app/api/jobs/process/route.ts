import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { processQueue } from '@/lib/jobs';

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { queue = 'default', limit = 10 } = body;

    const processed = await processQueue(queue, limit);

    return NextResponse.json({
      success: true,
      processed,
      queue,
    });
  } catch (error: any) {
    console.error('Job processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process jobs' },
      { status: 500 }
    );
  }
}
