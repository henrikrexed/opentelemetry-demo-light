package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"strings"
	"syscall"

	pb "github.com/opentelemetry-demo-light/product-catalog/genproto/oteldemo"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/status"

	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/baggage"
	"go.opentelemetry.io/otel/trace"
)

const (
	defaultPort    = "3550"
	catalogVersion = "1.0.0"
)

var tracer trace.Tracer

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	tp, err := initTracerProvider(ctx)
	if err != nil {
		log.Fatalf("failed to init tracer provider: %v", err)
	}
	defer func() { _ = tp.Shutdown(context.Background()) }()

	tracer = otel.Tracer("product-catalog")

	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	db, err := connectDB()
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	svc, err := NewProductCatalogService(ctx, db)
	if err != nil {
		log.Fatalf("failed to create service: %v", err)
	}

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("failed to listen on port %s: %v", port, err)
	}

	grpcServer := grpc.NewServer(
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
	)
	pb.RegisterProductCatalogServiceServer(grpcServer, svc)
	healthpb.RegisterHealthServer(grpcServer, &healthServer{})

	go func() {
		<-ctx.Done()
		log.Println("shutting down gRPC server...")
		grpcServer.GracefulStop()
	}()

	log.Printf("product-catalog service listening on :%s", port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("gRPC server failed: %v", err)
	}
}

// healthServer implements the gRPC Health Checking Protocol.
type healthServer struct {
	healthpb.UnimplementedHealthServer
}

func (h *healthServer) Check(ctx context.Context, req *healthpb.HealthCheckRequest) (*healthpb.HealthCheckResponse, error) {
	return &healthpb.HealthCheckResponse{Status: healthpb.HealthCheckResponse_SERVING}, nil
}

func (h *healthServer) Watch(req *healthpb.HealthCheckRequest, srv healthpb.Health_WatchServer) error {
	return status.Error(codes.Unimplemented, "watch is not implemented")
}

// ProductCatalogService implements the gRPC ProductCatalogService.
type ProductCatalogService struct {
	pb.UnimplementedProductCatalogServiceServer
	products []*pb.Product
}

// NewProductCatalogService loads products from the database into memory cache.
func NewProductCatalogService(ctx context.Context, db DBConn) (*ProductCatalogService, error) {
	ctx, span := tracer.Start(ctx, "ProductCatalogService.Init")
	defer span.End()

	products, err := loadProductsFromDB(ctx, db)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("loading products from DB: %w", err)
	}

	span.AddEvent("products loaded from database", trace.WithAttributes(
		attribute.Int("app.product.count", len(products)),
	))
	log.Printf("loaded %d products from database", len(products))

	return &ProductCatalogService{products: products}, nil
}

// ListProducts returns all products in the catalog.
func (s *ProductCatalogService) ListProducts(ctx context.Context, _ *pb.Empty) (*pb.ListProductsResponse, error) {
	ctx, span := tracer.Start(ctx, "ListProducts")
	defer span.End()

	span.SetAttributes(attribute.Int("app.product.count", len(s.products)))
	span.AddEvent("cache hit", trace.WithAttributes(
		attribute.Int("app.product.count", len(s.products)),
	))

	propagateBaggage(ctx, span)

	return &pb.ListProductsResponse{Products: s.products}, nil
}

// GetProduct returns a single product by ID.
func (s *ProductCatalogService) GetProduct(ctx context.Context, req *pb.GetProductRequest) (*pb.Product, error) {
	ctx, span := tracer.Start(ctx, "GetProduct")
	defer span.End()

	span.SetAttributes(attribute.String("app.product.id", req.GetId()))
	propagateBaggage(ctx, span)

	for _, p := range s.products {
		if p.Id == req.GetId() {
			span.AddEvent("cache hit", trace.WithAttributes(
				attribute.String("app.product.id", p.Id),
			))
			return p, nil
		}
	}

	span.AddEvent("product not found")
	return nil, status.Errorf(codes.NotFound, "product %q not found", req.GetId())
}

// SearchProducts performs a text search across product names and descriptions.
func (s *ProductCatalogService) SearchProducts(ctx context.Context, req *pb.SearchProductsRequest) (*pb.SearchProductsResponse, error) {
	ctx, span := tracer.Start(ctx, "SearchProducts")
	defer span.End()

	query := strings.ToLower(req.GetQuery())
	span.SetAttributes(attribute.String("app.search.query", query))
	propagateBaggage(ctx, span)

	var results []*pb.Product
	for _, p := range s.products {
		if strings.Contains(strings.ToLower(p.Name), query) ||
			strings.Contains(strings.ToLower(p.Description), query) {
			results = append(results, p)
		}
	}

	span.SetAttributes(attribute.Int("app.product.count", len(results)))
	span.AddEvent("search completed", trace.WithAttributes(
		attribute.Int("app.search.results.count", len(results)),
	))

	return &pb.SearchProductsResponse{Results: results}, nil
}

// propagateBaggage reads incoming baggage and attaches values as span attributes.
// It also adds a catalog version baggage entry.
func propagateBaggage(ctx context.Context, span trace.Span) {
	bag := baggage.FromContext(ctx)
	for _, m := range bag.Members() {
		span.SetAttributes(attribute.String("baggage."+m.Key(), m.Value()))
	}

	// Add catalog version to baggage
	member, err := baggage.NewMember("app.product.catalog_version", catalogVersion)
	if err == nil {
		newBag, err := bag.SetMember(member)
		if err == nil {
			_ = newBag // In a real app, you'd update the context for downstream propagation
		}
	}
}
