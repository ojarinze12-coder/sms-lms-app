import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashIp, getClientIp } from '@/lib/security';
import { logPlatformAudit } from '@/lib/platform-audit';

export async function POST(request: NextRequest) {
  try {
    const pccToken = request.cookies.get('pcc-token')?.value;
    const sccToken = request.cookies.get('scc-token')?.value;
    const legacyToken = request.cookies.get('auth-token')?.value;
    const authToken = pccToken || sccToken || legacyToken;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/auth');
    const payload = verifyToken(authToken);

    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { action, ip } = await request.json();
    const clientIp = getClientIp(request.headers);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { allowedIps: true },
    });

    let allowedIps: string[] = [];

    if (user?.allowedIps) {
      allowedIps = user.allowedIps.split(',').filter(Boolean);
    }

    if (action === 'add') {
      if (!ip) {
        return NextResponse.json({ error: 'IP address required' }, { status: 400 });
      }

      const hashedIp = hashIp(ip);
      if (!allowedIps.includes(hashedIp)) {
        allowedIps.push(hashedIp);
        
        await prisma.user.update({
          where: { id: payload.userId },
          data: { allowedIps: allowedIps.join(',') },
        });

        await logPlatformAudit({
          action: 'SUPER_ADMIN_IP_ADD',
          userId: payload.userId,
          description: `IP address added: ${ip}`,
          ipAddress: clientIp,
          metadata: { ip },
        });
      }

      return NextResponse.json({ message: 'IP added successfully', allowedIps });
    }

    if (action === 'remove') {
      if (!ip) {
        return NextResponse.json({ error: 'IP address required' }, { status: 400 });
      }

      const hashedIp = hashIp(ip);
      allowedIps = allowedIps.filter((savedIp) => savedIp !== hashedIp);
      
      await prisma.user.update({
        where: { id: payload.userId },
        data: { allowedIps: allowedIps.join(',') },
      });

      await logPlatformAudit({
        action: 'SUPER_ADMIN_IP_REMOVE',
        userId: payload.userId,
        description: `IP address removed: ${ip}`,
        ipAddress: clientIp,
        metadata: { ip },
      });

      return NextResponse.json({ message: 'IP removed successfully', allowedIps });
    }

    if (action === 'clear') {
      await prisma.user.update({
        where: { id: payload.userId },
        data: { allowedIps: '' },
      });

      await logPlatformAudit({
        action: 'SUPER_ADMIN_IP_REMOVE',
        userId: payload.userId,
        description: 'All IP restrictions cleared',
        ipAddress: clientIp,
      });

      return NextResponse.json({ message: 'All IPs cleared', allowedIps: [] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('IP management error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const pccToken = request.cookies.get('pcc-token')?.value;
    const sccToken = request.cookies.get('scc-token')?.value;
    const legacyToken = request.cookies.get('auth-token')?.value;
    const authToken = pccToken || sccToken || legacyToken;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/auth');
    const payload = verifyToken(authToken);

    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { allowedIps: true, lastLoginIp: true },
    });

    return NextResponse.json({
      allowedIps: user?.allowedIps || [],
      lastLoginIp: user?.lastLoginIp,
    });
  } catch (error) {
    console.error('IP list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
