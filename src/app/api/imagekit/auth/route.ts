import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const token = crypto.randomUUID();
  // The expiration time is in seconds. I'm setting it to 5 minutes from now.
  const expire = Math.floor(Date.now() / 1000) + (60 * 5); 
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!privateKey) {
    console.error("ImageKit private key is not configured in environment variables.");
    return NextResponse.json({ error: 'ImageKit server is not configured correctly.' }, { status: 500 });
  }

  // Generate the signature using the private key, token, and expiration time.
  const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');

  return NextResponse.json({ token, expire, signature });
}
