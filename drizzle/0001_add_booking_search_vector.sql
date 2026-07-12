ALTER TABLE "bookings" ADD COLUMN "search_vector" tsvector
GENERATED ALWAYS AS (
  to_tsvector('english',
    coalesce("customer_name", '') || ' ' ||
    coalesce("customer_email", '') || ' ' ||
    coalesce("notes", '')
  )
) STORED;

CREATE INDEX "bookings_search_vector_idx" ON "bookings" USING GIN ("search_vector");