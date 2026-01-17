


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."clothing_brightness" AS ENUM (
    'DARK',
    'MEDIUM',
    'LIGHT'
);


ALTER TYPE "public"."clothing_brightness" OWNER TO "postgres";


CREATE TYPE "public"."clothing_chroma" AS ENUM (
    'NEUTRAL',
    'PASTEL',
    'VIBRANT'
);


ALTER TYPE "public"."clothing_chroma" OWNER TO "postgres";


CREATE TYPE "public"."clothing_hue" AS ENUM (
    'RED',
    'ORANGE',
    'YELLOW',
    'GREEN',
    'BLUE',
    'PURPLE',
    'PINK',
    'BROWN',
    'BLACK',
    'WHITE',
    'GRAY'
);


ALTER TYPE "public"."clothing_hue" OWNER TO "postgres";


CREATE TYPE "public"."clothing_material" AS ENUM (
    'cotton',
    'denim',
    'wool',
    'leather',
    'synthetic'
);


ALTER TYPE "public"."clothing_material" OWNER TO "postgres";


CREATE TYPE "public"."clothing_occasion" AS ENUM (
    'daily',
    'work',
    'party',
    'sport',
    'date',
    'travel',
    'home',
    'formal-event'
);


ALTER TYPE "public"."clothing_occasion" OWNER TO "postgres";


CREATE TYPE "public"."clothing_pattern" AS ENUM (
    'solid',
    'stripes',
    'checks',
    'dots',
    'floral',
    'graphic',
    'animal'
);


ALTER TYPE "public"."clothing_pattern" OWNER TO "postgres";


CREATE TYPE "public"."clothing_season" AS ENUM (
    'spring',
    'summer',
    'autumn',
    'winter',
    'allseason'
);


ALTER TYPE "public"."clothing_season" OWNER TO "postgres";


CREATE TYPE "public"."clothing_source" AS ENUM (
    'upload',
    'shop'
);


ALTER TYPE "public"."clothing_source" OWNER TO "postgres";


CREATE TYPE "public"."clothing_style" AS ENUM (
    'casual',
    'formal',
    'sporty',
    'boho',
    'vintage',
    'minimalist'
);


ALTER TYPE "public"."clothing_style" OWNER TO "postgres";


CREATE TYPE "public"."clothing_type" AS ENUM (
    'top',
    'bottom',
    'dress',
    'outerwear',
    'shoes',
    'accessory'
);


ALTER TYPE "public"."clothing_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_daily_outfit_plans_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_daily_outfit_plans_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."closet_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "subcategory" "text",
    "brand" "text",
    "color" "text",
    "size" "text",
    "season" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "image_url" "text",
    "custom_group" "text",
    "is_archived" boolean DEFAULT false NOT NULL,
    "source_type" "text" DEFAULT 'OWNED'::"text" NOT NULL,
    "source_ref_id" "text",
    "status" "text" DEFAULT 'ACTIVE'::"text" NOT NULL,
    "acquired_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "closet_items_owned_ref_chk" CHECK ((("source_type" = 'OWNED'::"text") AND ("source_ref_id" IS NULL))),
    CONSTRAINT "closet_items_source_type_chk" CHECK (("source_type" = 'OWNED'::"text")),
    CONSTRAINT "closet_items_status_chk" CHECK (("status" = ANY (ARRAY['ACTIVE'::"text", 'ARCHIVED'::"text", 'DELETED'::"text"])))
);


ALTER TABLE "public"."closet_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clothing_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "public"."clothing_type" NOT NULL,
    "source" "public"."clothing_source" DEFAULT 'upload'::"public"."clothing_source" NOT NULL,
    "image_url" "text" NOT NULL,
    "original_image_url" "text",
    "colors" "text"[] NOT NULL,
    "dominant_color" "text",
    "hue" "public"."clothing_hue",
    "brightness" "public"."clothing_brightness",
    "chroma" "public"."clothing_chroma",
    "pattern" "public"."clothing_pattern",
    "material" "public"."clothing_material",
    "style" "public"."clothing_style",
    "occasion" "public"."clothing_occasion"[],
    "season" "public"."clothing_season",
    "custom_tags" "text"[],
    "shop_product_id" "text",
    "purchased" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."clothing_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_outfit_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "outfit_id" integer NOT NULL,
    "layout_slots" "jsonb" NOT NULL,
    "occasion" "text",
    "weather" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_outfit_plans" OWNER TO "postgres";


COMMENT ON TABLE "public"."daily_outfit_plans" IS '使用者每日穿搭計畫表，同用戶同一天只能有一套計畫';



COMMENT ON COLUMN "public"."daily_outfit_plans"."user_id" IS '使用者 ID（外鍵）';



COMMENT ON COLUMN "public"."daily_outfit_plans"."date" IS '穿搭計畫日期 (YYYY-MM-DD)';



COMMENT ON COLUMN "public"."daily_outfit_plans"."layout_slots" IS '完整白板布局結構（JSONB 格式）';



COMMENT ON COLUMN "public"."daily_outfit_plans"."occasion" IS '使用場合';



COMMENT ON COLUMN "public"."daily_outfit_plans"."weather" IS '天氣資訊';



CREATE TABLE IF NOT EXISTS "public"."saved_outfits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "outfit_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "weather_info" "jsonb",
    "occasion" "text" DEFAULT 'casual'::"text",
    "outfit_type" "text" DEFAULT 'saved'::"text",
    "is_liked" boolean DEFAULT false
);


ALTER TABLE "public"."saved_outfits" OWNER TO "postgres";


COMMENT ON COLUMN "public"."saved_outfits"."outfit_data" IS '完整的穿搭資料，包含圖片、名稱、描述和單品列表';



ALTER TABLE ONLY "public"."closet_items"
    ADD CONSTRAINT "closet_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clothing_items"
    ADD CONSTRAINT "clothing_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_outfit_plans"
    ADD CONSTRAINT "daily_outfit_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_outfit_plans"
    ADD CONSTRAINT "daily_outfit_plans_user_id_date_key" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."saved_outfits"
    ADD CONSTRAINT "saved_outfits_pkey" PRIMARY KEY ("id");



CREATE INDEX "closet_items_user_category_idx" ON "public"."closet_items" USING "btree" ("user_id", "category");



CREATE INDEX "closet_items_user_id_idx" ON "public"."closet_items" USING "btree" ("user_id");



CREATE INDEX "closet_items_user_source_status_idx" ON "public"."closet_items" USING "btree" ("user_id", "source_type", "status");



CREATE INDEX "idx_clothing_items_season" ON "public"."clothing_items" USING "btree" ("season");



CREATE INDEX "idx_clothing_items_type" ON "public"."clothing_items" USING "btree" ("type");



CREATE INDEX "idx_clothing_items_user_id" ON "public"."clothing_items" USING "btree" ("user_id");



CREATE INDEX "idx_daily_outfit_plans_user_date" ON "public"."daily_outfit_plans" USING "btree" ("user_id", "date" DESC);



CREATE INDEX "idx_daily_outfit_plans_user_id" ON "public"."daily_outfit_plans" USING "btree" ("user_id");



CREATE INDEX "idx_saved_outfits_created_at" ON "public"."saved_outfits" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_saved_outfits_is_liked" ON "public"."saved_outfits" USING "btree" ("user_id", "is_liked");



CREATE INDEX "idx_saved_outfits_occasion" ON "public"."saved_outfits" USING "btree" ("occasion");



CREATE INDEX "idx_saved_outfits_outfit_data_gin" ON "public"."saved_outfits" USING "gin" ("outfit_data");



CREATE INDEX "idx_saved_outfits_user_id" ON "public"."saved_outfits" USING "btree" ("user_id");



CREATE INDEX "idx_saved_outfits_user_type" ON "public"."saved_outfits" USING "btree" ("user_id", "outfit_type");



CREATE OR REPLACE TRIGGER "on_clothing_items_update" BEFORE UPDATE ON "public"."clothing_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_closet_items_updated_at" BEFORE UPDATE ON "public"."closet_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_daily_outfit_plans_updated_at" BEFORE UPDATE ON "public"."daily_outfit_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_daily_outfit_plans_updated_at"();



CREATE OR REPLACE TRIGGER "update_saved_outfits_updated_at" BEFORE UPDATE ON "public"."saved_outfits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."closet_items"
    ADD CONSTRAINT "closet_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_outfit_plans"
    ADD CONSTRAINT "daily_outfit_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow delete for all users" ON "public"."clothing_items" FOR DELETE USING (true);



CREATE POLICY "Allow insert for all users" ON "public"."clothing_items" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow select for all users" ON "public"."clothing_items" FOR SELECT USING (true);



CREATE POLICY "Allow update for all users" ON "public"."clothing_items" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."daily_outfit_plans" USING (true) WITH CHECK (true);



CREATE POLICY "Users can delete own outfits" ON "public"."saved_outfits" FOR DELETE USING (true);



CREATE POLICY "Users can delete their own saved outfits" ON "public"."saved_outfits" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own outfits" ON "public"."saved_outfits" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert their own saved outfits" ON "public"."saved_outfits" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own saved outfits" ON "public"."saved_outfits" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own outfits" ON "public"."saved_outfits" FOR SELECT USING (true);



CREATE POLICY "Users can view their own saved outfits" ON "public"."saved_outfits" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."closet_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "closet_items_delete_own" ON "public"."closet_items" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "closet_items_insert_own" ON "public"."closet_items" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "closet_items_select_own" ON "public"."closet_items" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "closet_items_update_own" ON "public"."closet_items" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."clothing_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_outfit_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_own_daily_outfit_plans" ON "public"."daily_outfit_plans" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_daily_outfit_plans" ON "public"."daily_outfit_plans" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_daily_outfits" ON "public"."daily_outfit_plans" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."saved_outfits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_own_daily_outfit_plans" ON "public"."daily_outfit_plans" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_daily_outfits" ON "public"."daily_outfit_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_daily_outfit_plans" ON "public"."daily_outfit_plans" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_daily_outfits" ON "public"."daily_outfit_plans" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_daily_outfit_plans_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_daily_outfit_plans_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_daily_outfit_plans_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."closet_items" TO "anon";
GRANT ALL ON TABLE "public"."closet_items" TO "authenticated";
GRANT ALL ON TABLE "public"."closet_items" TO "service_role";



GRANT ALL ON TABLE "public"."clothing_items" TO "anon";
GRANT ALL ON TABLE "public"."clothing_items" TO "authenticated";
GRANT ALL ON TABLE "public"."clothing_items" TO "service_role";



GRANT ALL ON TABLE "public"."daily_outfit_plans" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."daily_outfit_plans" TO "authenticated";



GRANT ALL ON TABLE "public"."saved_outfits" TO "anon";
GRANT ALL ON TABLE "public"."saved_outfits" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_outfits" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

revoke delete on table "public"."daily_outfit_plans" from "anon";

revoke insert on table "public"."daily_outfit_plans" from "anon";

revoke references on table "public"."daily_outfit_plans" from "anon";

revoke select on table "public"."daily_outfit_plans" from "anon";

revoke trigger on table "public"."daily_outfit_plans" from "anon";

revoke truncate on table "public"."daily_outfit_plans" from "anon";

revoke update on table "public"."daily_outfit_plans" from "anon";

revoke references on table "public"."daily_outfit_plans" from "authenticated";

revoke trigger on table "public"."daily_outfit_plans" from "authenticated";

revoke truncate on table "public"."daily_outfit_plans" from "authenticated";


