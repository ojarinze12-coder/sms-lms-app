import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt, generateTwoFactorSecret, generateBackupCodes, getClientIp } from '@/lib/security';
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

    const { action, code } = await request.json();
    const clientIp = getClientIp(request.headers);

    if (action === 'setup') {
      const secret = generateTwoFactorSecret();
      const backupCodes = generateBackupCodes(10);
      const encryptedSecret = encrypt(secret);

      await prisma.user.update({
        where: { id: payload.userId },
        data: {
          twoFactorSecret: encryptedSecret,
          twoFactorBackupCodes: backupCodes.join(','),
        },
      });

      return NextResponse.json({
        secret,
        backupCodes,
        message: '2FA setup complete. Save your backup codes securely.',
      });
    }

    if (action === 'enable') {
      if (!code) {
        return NextResponse.json({ error: 'Verification code required' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { twoFactorSecret: true, twoFactorBackupCodes: true },
      });

      if (!user?.twoFactorSecret) {
        return NextResponse.json({ error: '2FA not setup' }, { status: 400 });
      }

      try {
        const secret = decrypt(user.twoFactorSecret);
        if (code !== secret.slice(0, 6)) {
          const isBackupCode = user.twoFactorBackupCodes?.includes(code.toUpperCase());
          if (!isBackupCode) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
          }
        }
      } catch {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
      }

      await prisma.user.update({
        where: { id: payload.userId },
        data: { twoFactorEnabled: true },
      });

      await logPlatformAudit({
        action: 'SUPER_ADMIN_2FA_ENABLED',
        userId: payload.userId,
        description: '2FA was enabled for Super Admin',
        ipAddress: clientIp,
      });

      return NextResponse.json({ message: '2FA enabled successfully' });
    }

    if (action === 'disable') {
      if (!code) {
        return NextResponse.json({ error: 'Password required to disable 2FA' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { password: true },
      });

      if (!user?.password) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }

      const { comparePassword } = await import('@/lib/auth');
      const isValid = comparePassword(code, user.password);

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      await prisma.user.update({
        where: { id: payload.userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: '',
        },
      });

      await logPlatformAudit({
        action: 'SUPER_ADMIN_2FA_DISABLED',
        userId: payload.userId,
        description: '2FA was disabled for Super Admin',
        ipAddress: clientIp,
      });

      return NextResponse.json({ message: '2FA disabled successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('2FA error:', error);
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
      select: {
        twoFactorEnabled: true,
        lastLoginAt: true,
        lastLoginIp: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    return NextResponse.json({
      twoFactorEnabled: user?.twoFactorEnabled || false,
      lastLoginAt: user?.lastLoginAt,
      lastLoginIp: user?.lastLoginIp,
      failedLoginAttempts: user?.failedLoginAttempts || 0,
      isLocked: user?.lockedUntil && new Date(user.lockedUntil) > new Date(),
    });
  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
