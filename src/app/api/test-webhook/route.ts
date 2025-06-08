import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('🔔 Test webhook received:');
    console.log('Headers:', headers);
    console.log('Body:', body);
    
    // Try to parse as JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
      console.log('Parsed body:', parsedBody);
    } catch (e) {
      console.log('Body is not JSON');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Test webhook failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Test webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
} 