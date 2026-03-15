package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"

	pb "github.com/opentelemetry-demo-light/product-catalog/genproto/oteldemo"
	_ "github.com/lib/pq"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// DBConn abstracts the database connection for testing.
type DBConn interface {
	QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error)
	Close() error
}

func connectDB() (*sql.DB, error) {
	host := envOrDefault("POSTGRES_HOST", "localhost")
	port := envOrDefault("POSTGRES_PORT", "5432")
	user := envOrDefault("POSTGRES_USER", "otel")
	password := envOrDefault("POSTGRES_PASSWORD", "otel")
	dbname := envOrDefault("POSTGRES_DB", "product_catalog")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("sql.Open: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("db.Ping: %w", err)
	}

	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(2)

	return db, nil
}

func loadProductsFromDB(ctx context.Context, db DBConn) ([]*pb.Product, error) {
	_, span := tracer.Start(ctx, "loadProductsFromDB")
	defer span.End()

	span.AddEvent("querying products table")

	rows, err := db.QueryContext(ctx,
		"SELECT id, name, description, picture, price_usd_cents, categories FROM products ORDER BY name")
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("query products: %w", err)
	}
	defer rows.Close()

	var products []*pb.Product
	for rows.Next() {
		var (
			id, name, description, picture string
			priceCents                     int64
			categories                     []string
		)
		if err := rows.Scan(&id, &name, &description, &picture, &priceCents, pqArrayScanner(&categories)); err != nil {
			span.RecordError(err)
			return nil, fmt.Errorf("scan product row: %w", err)
		}
		products = append(products, &pb.Product{
			Id:          id,
			Name:        name,
			Description: description,
			Picture:     picture,
			PriceUsd:    &pb.Money{AmountCents: priceCents},
			Categories:  categories,
		})
	}
	if err := rows.Err(); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("rows iteration: %w", err)
	}

	span.SetAttributes(attribute.Int("app.product.count", len(products)))
	span.AddEvent("DB query completed", trace.WithAttributes(
		attribute.Int("app.product.count", len(products)),
	))

	return products, nil
}

func envOrDefault(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
