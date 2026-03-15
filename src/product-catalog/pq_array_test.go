package main

import (
	"reflect"
	"testing"
)

func TestPqArrayScan_Empty(t *testing.T) {
	var result []string
	scanner := pqArrayScanner(&result)
	if err := scanner.Scan("{}"); err != nil {
		t.Fatalf("Scan({}) failed: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("expected empty slice, got %v", result)
	}
}

func TestPqArrayScan_SingleValue(t *testing.T) {
	var result []string
	scanner := pqArrayScanner(&result)
	if err := scanner.Scan("{telescopes}"); err != nil {
		t.Fatalf("Scan failed: %v", err)
	}
	expected := []string{"telescopes"}
	if !reflect.DeepEqual(result, expected) {
		t.Errorf("expected %v, got %v", expected, result)
	}
}

func TestPqArrayScan_MultipleValues(t *testing.T) {
	var result []string
	scanner := pqArrayScanner(&result)
	if err := scanner.Scan("{telescopes,accessories,filters}"); err != nil {
		t.Fatalf("Scan failed: %v", err)
	}
	expected := []string{"telescopes", "accessories", "filters"}
	if !reflect.DeepEqual(result, expected) {
		t.Errorf("expected %v, got %v", expected, result)
	}
}

func TestPqArrayScan_QuotedValues(t *testing.T) {
	var result []string
	scanner := pqArrayScanner(&result)
	if err := scanner.Scan(`{"hello world","foo,bar"}`); err != nil {
		t.Fatalf("Scan failed: %v", err)
	}
	expected := []string{"hello world", "foo,bar"}
	if !reflect.DeepEqual(result, expected) {
		t.Errorf("expected %v, got %v", expected, result)
	}
}

func TestPqArrayScan_Nil(t *testing.T) {
	var result []string
	scanner := pqArrayScanner(&result)
	if err := scanner.Scan(nil); err != nil {
		t.Fatalf("Scan(nil) failed: %v", err)
	}
	if result != nil {
		t.Errorf("expected nil, got %v", result)
	}
}

func TestPqArrayScan_Bytes(t *testing.T) {
	var result []string
	scanner := pqArrayScanner(&result)
	if err := scanner.Scan([]byte("{a,b}")); err != nil {
		t.Fatalf("Scan([]byte) failed: %v", err)
	}
	expected := []string{"a", "b"}
	if !reflect.DeepEqual(result, expected) {
		t.Errorf("expected %v, got %v", expected, result)
	}
}
