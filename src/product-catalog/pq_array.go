package main

import (
	"database/sql/driver"
	"fmt"
	"strings"
)

// pqArrayScanner returns a scanner for PostgreSQL text[] arrays.
// It handles the PostgreSQL array format: {val1,val2,val3}
type pgTextArray struct {
	result *[]string
}

func pqArrayScanner(dest *[]string) *pgTextArray {
	return &pgTextArray{result: dest}
}

func (a *pgTextArray) Scan(src interface{}) error {
	if src == nil {
		*a.result = nil
		return nil
	}

	var raw string
	switch v := src.(type) {
	case string:
		raw = v
	case []byte:
		raw = string(v)
	default:
		return fmt.Errorf("pgTextArray.Scan: unsupported type %T", src)
	}

	// Parse PostgreSQL array format: {val1,val2,"val with spaces"}
	raw = strings.TrimSpace(raw)
	if raw == "{}" || raw == "" {
		*a.result = []string{}
		return nil
	}
	if len(raw) < 2 || raw[0] != '{' || raw[len(raw)-1] != '}' {
		return fmt.Errorf("pgTextArray.Scan: invalid array format: %q", raw)
	}

	inner := raw[1 : len(raw)-1]
	*a.result = splitPgArray(inner)
	return nil
}

// Value implements driver.Valuer (not needed for reads, but good practice).
func (a *pgTextArray) Value() (driver.Value, error) {
	if a.result == nil || len(*a.result) == 0 {
		return "{}", nil
	}
	return "{" + strings.Join(*a.result, ",") + "}", nil
}

// splitPgArray splits a PostgreSQL array inner string, handling quoted values.
func splitPgArray(s string) []string {
	var result []string
	var current strings.Builder
	inQuote := false
	escaped := false

	for _, ch := range s {
		if escaped {
			current.WriteRune(ch)
			escaped = false
			continue
		}
		if ch == '\\' {
			escaped = true
			continue
		}
		if ch == '"' {
			inQuote = !inQuote
			continue
		}
		if ch == ',' && !inQuote {
			result = append(result, current.String())
			current.Reset()
			continue
		}
		current.WriteRune(ch)
	}
	if current.Len() > 0 {
		result = append(result, current.String())
	}
	return result
}
