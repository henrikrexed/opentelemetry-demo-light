package main

import (
	"context"
	"testing"

	pb "github.com/opentelemetry-demo-light/product-catalog/genproto/oteldemo"
	"go.opentelemetry.io/otel"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func init() {
	// Set up a no-op tracer for tests
	tp := sdktrace.NewTracerProvider()
	otel.SetTracerProvider(tp)
	tracer = otel.Tracer("product-catalog-test")
}

func testProducts() []*pb.Product {
	return []*pb.Product{
		{
			Id:          "TEST1",
			Name:        "Test Telescope",
			Description: "A test telescope for unit testing",
			Picture:     "/images/test.jpg",
			PriceUsd:    &pb.Money{AmountCents: 9999},
			Categories:  []string{"telescopes"},
		},
		{
			Id:          "TEST2",
			Name:        "Test Binoculars",
			Description: "Binoculars for stargazing",
			Picture:     "/images/binos.jpg",
			PriceUsd:    &pb.Money{AmountCents: 4999},
			Categories:  []string{"binoculars"},
		},
		{
			Id:          "TEST3",
			Name:        "Lens Cleaning Kit",
			Description: "Clean your telescope lenses",
			Picture:     "/images/kit.jpg",
			PriceUsd:    &pb.Money{AmountCents: 1599},
			Categories:  []string{"accessories"},
		},
	}
}

func newTestService() *ProductCatalogService {
	return &ProductCatalogService{products: testProducts()}
}

func TestListProducts(t *testing.T) {
	svc := newTestService()
	resp, err := svc.ListProducts(context.Background(), &pb.Empty{})
	if err != nil {
		t.Fatalf("ListProducts failed: %v", err)
	}
	if len(resp.Products) != 3 {
		t.Errorf("expected 3 products, got %d", len(resp.Products))
	}
}

func TestGetProduct_Found(t *testing.T) {
	svc := newTestService()
	product, err := svc.GetProduct(context.Background(), &pb.GetProductRequest{Id: "TEST1"})
	if err != nil {
		t.Fatalf("GetProduct failed: %v", err)
	}
	if product.Id != "TEST1" {
		t.Errorf("expected product ID TEST1, got %s", product.Id)
	}
	if product.Name != "Test Telescope" {
		t.Errorf("expected name 'Test Telescope', got %q", product.Name)
	}
	if product.PriceUsd.AmountCents != 9999 {
		t.Errorf("expected price 9999, got %d", product.PriceUsd.AmountCents)
	}
}

func TestGetProduct_NotFound(t *testing.T) {
	svc := newTestService()
	_, err := svc.GetProduct(context.Background(), &pb.GetProductRequest{Id: "NONEXISTENT"})
	if err == nil {
		t.Fatal("expected error for nonexistent product")
	}
	st, ok := status.FromError(err)
	if !ok {
		t.Fatalf("expected gRPC status error, got %v", err)
	}
	if st.Code() != codes.NotFound {
		t.Errorf("expected NOT_FOUND, got %v", st.Code())
	}
}

func TestSearchProducts_MatchesName(t *testing.T) {
	svc := newTestService()
	resp, err := svc.SearchProducts(context.Background(), &pb.SearchProductsRequest{Query: "binoculars"})
	if err != nil {
		t.Fatalf("SearchProducts failed: %v", err)
	}
	if len(resp.Results) != 1 {
		t.Errorf("expected 1 result for 'binoculars', got %d", len(resp.Results))
	}
	if len(resp.Results) > 0 && resp.Results[0].Id != "TEST2" {
		t.Errorf("expected TEST2, got %s", resp.Results[0].Id)
	}
}

func TestSearchProducts_MatchesDescription(t *testing.T) {
	svc := newTestService()
	resp, err := svc.SearchProducts(context.Background(), &pb.SearchProductsRequest{Query: "stargazing"})
	if err != nil {
		t.Fatalf("SearchProducts failed: %v", err)
	}
	if len(resp.Results) != 1 {
		t.Errorf("expected 1 result for 'stargazing', got %d", len(resp.Results))
	}
}

func TestSearchProducts_CaseInsensitive(t *testing.T) {
	svc := newTestService()
	resp, err := svc.SearchProducts(context.Background(), &pb.SearchProductsRequest{Query: "BINOCULARS"})
	if err != nil {
		t.Fatalf("SearchProducts failed: %v", err)
	}
	if len(resp.Results) != 1 {
		t.Errorf("expected 1 result for 'BINOCULARS', got %d", len(resp.Results))
	}
}

func TestSearchProducts_MultipleMatches(t *testing.T) {
	svc := newTestService()
	// "telescope" appears in TEST1 name and TEST3 description ("telescope lenses")
	resp, err := svc.SearchProducts(context.Background(), &pb.SearchProductsRequest{Query: "telescope"})
	if err != nil {
		t.Fatalf("SearchProducts failed: %v", err)
	}
	if len(resp.Results) != 2 {
		t.Errorf("expected 2 results for 'telescope' (name + description match), got %d", len(resp.Results))
	}
}

func TestSearchProducts_NoMatch(t *testing.T) {
	svc := newTestService()
	resp, err := svc.SearchProducts(context.Background(), &pb.SearchProductsRequest{Query: "xyz123nonexistent"})
	if err != nil {
		t.Fatalf("SearchProducts failed: %v", err)
	}
	if len(resp.Results) != 0 {
		t.Errorf("expected 0 results, got %d", len(resp.Results))
	}
}
