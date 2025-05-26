CREATE TABLE "config" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"value" jsonb DEFAULT '{"github_webhook":{"bot_to_discord":null}}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_channels" (
	"id" integer PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL
);
