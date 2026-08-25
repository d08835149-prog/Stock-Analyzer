import {
  NextRequest,
  NextResponse,
} from "next/server";

import { sql } from "@/lib/db";
import {
  hashPassword,
} from "@/lib/auth";

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const nickname =
      String(
        body.nickname ?? ""
      ).trim();

    const password =
      String(
        body.password ?? ""
      );

    if (
      !nickname ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            "Nickname and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 4 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await sql`
        SELECT id
        FROM users
        WHERE nickname = ${nickname}
        LIMIT 1
      `;

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error:
            "Nickname already taken.",
        },
        {
          status: 409,
        }
      );
    }

    const hashedPassword =
      hashPassword(password);

    const result =
      await sql`
        INSERT INTO users (
          nickname,
          password
        )
        VALUES (
          ${nickname},
          ${hashedPassword}
        )
        RETURNING
          id,
          nickname,
          created_at
      `;

    return NextResponse.json(
      {
        success: true,
        user: result[0],
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Signup error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Internal server error.",
      },
      {
        status: 500,
      }
    );
  }
}