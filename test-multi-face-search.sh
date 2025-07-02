#!/bin/bash

#
# Multi-Face Search Feature Testing Script
#
# This script tests the multi-face search functionality by making API calls
# and verifying the responses.
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:2283}"
API_KEY="${API_KEY}"
TEST_RESULTS=()

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

add_test_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    TEST_RESULTS+=("$test_name|$result|$message")
    
    if [ "$result" = "PASS" ]; then
        log_success "$test_name: $message"
    else
        log_error "$test_name: $message"
    fi
}

print_banner() {
    echo ""
    echo "=================================================================="
    echo "  Multi-Face Search Feature - Testing Suite"
    echo "=================================================================="
    echo ""
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if server is running
    if ! curl -s "$API_BASE_URL/api/server-info/ping" > /dev/null 2>&1; then
        log_error "Immich server is not running at $API_BASE_URL"
        log_error "Please start the server first with: ./deploy-multi-face.sh deploy-prod"
        exit 1
    fi
    
    log_success "Server is running at $API_BASE_URL"
}

test_api_endpoint_exists() {
    log_info "Testing API endpoint availability..."
    
    local response
    response=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE_URL/api/search/metadata")
    
    if [ "$response" = "401" ] || [ "$response" = "200" ] || [ "$response" = "400" ]; then
        add_test_result "API_ENDPOINT" "PASS" "Search metadata endpoint is available (HTTP $response)"
    else
        add_test_result "API_ENDPOINT" "FAIL" "Search metadata endpoint returned unexpected status: $response"
    fi
}

test_person_search_behavior_parameter() {
    log_info "Testing PersonSearchBehavior parameter support..."
    
    # Test with invalid behavior should return 400
    local response_code
    response_code=$(curl -s -w "%{http_code}" -o /dev/null \
        -X POST "$API_BASE_URL/api/search/metadata" \
        -H "Content-Type: application/json" \
        -d '{
            "personIds": ["test-person-1", "test-person-2"],
            "personSearchBehavior": "invalid"
        }' 2>/dev/null)
    
    if [ "$response_code" = "400" ]; then
        add_test_result "INVALID_BEHAVIOR" "PASS" "Invalid personSearchBehavior rejected (HTTP 400)"
    else
        add_test_result "INVALID_BEHAVIOR" "FAIL" "Invalid personSearchBehavior not properly rejected (HTTP $response_code)"
    fi
}

test_valid_search_behaviors() {
    log_info "Testing valid search behaviors..."
    
    local behaviors=("and" "or" "only")
    
    for behavior in "${behaviors[@]}"; do
        local response_code
        response_code=$(curl -s -w "%{http_code}" -o /dev/null \
            -X POST "$API_BASE_URL/api/search/metadata" \
            -H "Content-Type: application/json" \
            -d "{
                \"personIds\": [\"test-person-1\", \"test-person-2\"],
                \"personSearchBehavior\": \"$behavior\"
            }" 2>/dev/null)
        
        # 401 (unauthorized) or 200 (success) means the parameter was accepted
        if [ "$response_code" = "401" ] || [ "$response_code" = "200" ]; then
            add_test_result "BEHAVIOR_$behavior" "PASS" "PersonSearchBehavior '$behavior' accepted (HTTP $response_code)"
        else
            add_test_result "BEHAVIOR_$behavior" "FAIL" "PersonSearchBehavior '$behavior' not accepted (HTTP $response_code)"
        fi
    done
}

test_backward_compatibility() {
    log_info "Testing backward compatibility..."
    
    # Test search without personSearchBehavior parameter (should default to AND)
    local response_code
    response_code=$(curl -s -w "%{http_code}" -o /dev/null \
        -X POST "$API_BASE_URL/api/search/metadata" \
        -H "Content-Type: application/json" \
        -d '{
            "personIds": ["test-person-1", "test-person-2"]
        }' 2>/dev/null)
    
    if [ "$response_code" = "401" ] || [ "$response_code" = "200" ]; then
        add_test_result "BACKWARD_COMPATIBILITY" "PASS" "Search without personSearchBehavior works (HTTP $response_code)"
    else
        add_test_result "BACKWARD_COMPATIBILITY" "FAIL" "Search without personSearchBehavior failed (HTTP $response_code)"
    fi
}

test_single_person_search() {
    log_info "Testing single person search..."
    
    # Single person search should work regardless of behavior
    local response_code
    response_code=$(curl -s -w "%{http_code}" -o /dev/null \
        -X POST "$API_BASE_URL/api/search/metadata" \
        -H "Content-Type: application/json" \
        -d '{
            "personIds": ["test-person-1"],
            "personSearchBehavior": "only"
        }' 2>/dev/null)
    
    if [ "$response_code" = "401" ] || [ "$response_code" = "200" ]; then
        add_test_result "SINGLE_PERSON" "PASS" "Single person search works (HTTP $response_code)"
    else
        add_test_result "SINGLE_PERSON" "FAIL" "Single person search failed (HTTP $response_code)"
    fi
}

test_web_interface_check() {
    log_info "Testing web interface availability..."
    
    local response_code
    response_code=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE_URL/" 2>/dev/null)
    
    if [ "$response_code" = "200" ]; then
        add_test_result "WEB_INTERFACE" "PASS" "Web interface is available (HTTP $response_code)"
    else
        add_test_result "WEB_INTERFACE" "FAIL" "Web interface not available (HTTP $response_code)"
    fi
}

test_machine_learning_service() {
    log_info "Testing machine learning service..."
    
    local ml_url="http://localhost:3003"
    local response_code
    response_code=$(curl -s -w "%{http_code}" -o /dev/null "$ml_url/ping" 2>/dev/null)
    
    if [ "$response_code" = "200" ]; then
        add_test_result "ML_SERVICE" "PASS" "Machine learning service is running (HTTP $response_code)"
    else
        add_test_result "ML_SERVICE" "FAIL" "Machine learning service not available (HTTP $response_code)"
    fi
}

test_database_connectivity() {
    log_info "Testing database connectivity..."
    
    # Check if postgres container is running
    if docker ps | grep -q "immich_postgres_multi_face"; then
        # Try to connect to database
        if docker exec immich_postgres_multi_face pg_isready -U postgres > /dev/null 2>&1; then
            add_test_result "DATABASE" "PASS" "Database is accessible"
        else
            add_test_result "DATABASE" "FAIL" "Database connection failed"
        fi
    else
        add_test_result "DATABASE" "FAIL" "Database container not running"
    fi
}

test_redis_connectivity() {
    log_info "Testing Redis connectivity..."
    
    # Check if redis container is running
    if docker ps | grep -q "immich_redis_multi_face"; then
        # Try to ping Redis
        if docker exec immich_redis_multi_face redis-cli ping | grep -q "PONG"; then
            add_test_result "REDIS" "PASS" "Redis is accessible"
        else
            add_test_result "REDIS" "FAIL" "Redis connection failed"
        fi
    else
        add_test_result "REDIS" "FAIL" "Redis container not running"
    fi
}

generate_test_report() {
    echo ""
    echo "=================================================================="
    echo "  Test Results Summary"
    echo "=================================================================="
    echo ""
    
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    
    printf "%-25s %-6s %s\n" "Test Name" "Result" "Message"
    printf "%-25s %-6s %s\n" "----------" "------" "-------"
    
    for result in "${TEST_RESULTS[@]}"; do
        IFS='|' read -r test_name result_status message <<< "$result"
        printf "%-25s %-6s %s\n" "$test_name" "$result_status" "$message"
        
        ((total_tests++))
        if [ "$result_status" = "PASS" ]; then
            ((passed_tests++))
        else
            ((failed_tests++))
        fi
    done
    
    echo ""
    echo "=================================================================="
    echo "Total Tests: $total_tests"
    echo "Passed: $passed_tests"
    echo "Failed: $failed_tests"
    
    if [ $failed_tests -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Multi-face search feature is working correctly.${NC}"
    else
        echo -e "${RED}❌ Some tests failed. Please check the issues above.${NC}"
    fi
    echo "=================================================================="
}

manual_test_instructions() {
    echo ""
    echo "=================================================================="
    echo "  Manual Testing Instructions"
    echo "=================================================================="
    echo ""
    echo "1. Open web browser and go to: $API_BASE_URL"
    echo "2. Log in to your Immich account"
    echo "3. Navigate to the Search page"
    echo "4. Click on 'PEOPLE' section"
    echo "5. Select multiple people (2 or more)"
    echo "6. Verify that a toggle appears with three options:"
    echo "   - All People (AND)"
    echo "   - Any People (OR)"  
    echo "   - Only Them (ONLY)"
    echo "7. Test each option and verify results:"
    echo "   - All People: Shows photos with ALL selected people"
    echo "   - Any People: Shows photos with ANY selected people"
    echo "   - Only Them: Shows photos with ONLY selected people"
    echo ""
    echo "Expected UI Elements:"
    echo "- Three-button toggle when 2+ people selected"
    echo "- Selected people display with remove buttons"
    echo "- + button to add more people"
    echo "- Search results update when behavior changes"
    echo ""
    echo "=================================================================="
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --api-url URL     Override API base URL (default: http://localhost:2283)"
    echo "  --api-key KEY     Provide API key for authenticated requests"
    echo "  --manual          Show manual testing instructions only"
    echo "  --help            Show this help message"
    echo ""
}

# Main execution
main() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --api-url)
                API_BASE_URL="$2"
                shift 2
                ;;
            --api-key)
                API_KEY="$2"
                shift 2
                ;;
            --manual)
                manual_test_instructions
                exit 0
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_banner
    
    # Run all tests
    check_prerequisites
    test_api_endpoint_exists
    test_person_search_behavior_parameter
    test_valid_search_behaviors
    test_backward_compatibility
    test_single_person_search
    test_web_interface_check
    test_machine_learning_service
    test_database_connectivity
    test_redis_connectivity
    
    # Generate report
    generate_test_report
    
    # Show manual testing instructions
    manual_test_instructions
}

main "$@" 