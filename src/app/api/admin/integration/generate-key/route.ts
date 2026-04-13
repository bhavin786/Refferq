import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';

/**
 * POST /api/admin/integration/generate-key - Generate API keys for tracking
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Generate secure API keys
    const publicKey = 'pk_' + crypto.randomBytes(32).toString('hex');
    const rawApiKey = 'sk_' + crypto.randomBytes(32).toString('hex');
    // SECURITY: Store only a SHA-256 hash of the secret key
    const apiKeyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
    const apiKeyPrefix = rawApiKey.slice(0, 7) + '...'; // Store prefix for display

    // Check if integration settings exist
    const existing = await prisma.integrationSettings.findUnique({
      where: { userId: user.id }
    });

    let integration;

    if (existing) {
      integration = await prisma.integrationSettings.update({
        where: { userId: user.id },
        data: {
          publicKey,
          apiKey: apiKeyHash,
          provider: 'refferq',
          isActive: true,
        }
      });
    } else {
      integration = await prisma.integrationSettings.create({
        data: {
          userId: user.id,
          publicKey,
          apiKey: apiKeyHash,
          provider: 'refferq',
          isActive: true,
          config: {},
        }
      });
    }

    // Return the raw key ONLY on generation — it cannot be retrieved later
    return NextResponse.json({
      success: true,
      message: 'API keys generated successfully. Save the secret key — it will not be shown again.',
      keys: {
        publicKey: integration.publicKey,
        apiKey: rawApiKey,
      },
      integration: {
        ...integration,
        apiKey: apiKeyPrefix, // Never expose the hash
      },
    });

  } catch (error) {
    console.error('Generate API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate API keys' },
      { status: 500 }
    );
  }
}
