import { PROJECT_TITLE } from "~/lib/constants";

export async function GET() {
  const appUrl =
    process.env.NEXT_PUBLIC_URL ||
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjg2OTk5OSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDc2ZDUwQjBFMTQ3OWE5QmEyYkQ5MzVGMUU5YTI3QzBjNjQ5QzhDMTIifQ",
      payload:
        "eyJkb21haW4iOiIweHNwZW5jZXItZmFyY2FzdGVyY29sbGVjdGlibGVzLnZlcmNlbC5hcHAifQ",
      signature:
        "MHg4MWM0NjBhY2ZjNTAwNDg2NGRkZDlhMDZlNDk0ZjUwNjRhNjI0MWU1NzdiNzE2YzU5YzZhNDA2Y2MyZDE0MTUwNDc3YzNmZjgzYjkzMzhiNWZhNDQxNjgxOTRiMGMyNzdkZjA4ZWVlNzIzMTRjOWNjYjFkNDU2ODIyNTQ2ODFmYzFj",
    },
    frame: {
      version: "1",
      name: PROJECT_TITLE,
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/og.png`,
      buttonTitle: "Open",
      webhookUrl: `${appUrl}/api/webhook`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#555555",
    },
  };

  return Response.json(config);
}
