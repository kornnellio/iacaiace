import { connectToDatabase } from "@/lib/database";
import { AnnouncementBar } from "@/lib/database/models/models";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get the first announcement (we should only have one)
    const announcement = await AnnouncementBar.findOne();
    
    return NextResponse.json({ announcement });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    
    const data = await request.json();
    
    // Update or create the announcement
    const announcement = await AnnouncementBar.findOneAndUpdate(
      {}, // empty filter to match first document
      {
        text: data.text,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        isEnabled: data.isEnabled,
      },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ announcement });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 