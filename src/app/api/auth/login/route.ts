import {
  NextRequest,
  NextResponse,
} from "next/server";

import { sql } from "@/lib/db";

import {
  createSessionToken,
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

    const users =
      await sql`
        SELECT
          id,
          nickname,
          password
        FROM users
        WHERE nickname = ${nickname}
        LIMIT 1
      `;

    if (users.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nickname not found.",
        },
        {
          status: 401,
        }
      );
    }

    const user =
      users[0];

    const hashedPassword =
      hashPassword(password);

    if (
      user.password !==
      hashedPassword
    ) {
      return NextResponse.json(
        {
          error:
            "Wrong password.",
        },
        {
          status: 401,
        }
      );
    }

    const token =
      await createSessionToken({
        id: user.id,
        nickname:
          user.nickname,
      });

    const response =
      NextResponse.json({
        success: true,
        user: {
          id: user.id,
          nickname:
            user.nickname,
        },
      });

    response.cookies.set(
      "stock_analyzer_session",
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge:
          60 *
          60 *
          24 *
          7,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Login error:",
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