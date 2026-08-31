import { NextRequest, NextResponse } from "next/server";
import { db, tools } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_KEY || "admin123";
  return authHeader === `Bearer ${adminKey}`;
}

/**
 * DELETE /api/admin/tools/[id] - Delete a tool
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await db
      .delete(tools)
      .where(eq(tools.id, params.id))
      .returning({ name: tools.name });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `"${deleted[0].name}" deleted.`,
    });
  } catch (error) {
    console.error("Error deleting tool:", error);
    return NextResponse.json(
      { error: "Failed to delete tool" },
      { status: 500 }
    );
  }
}
