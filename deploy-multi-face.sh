#!/bin/bash

#
# Multi-Face Search Feature Deployment Script
# 
# This script automates the build and deployment of Immich with the new multi-face search feature.
# It provides options for development, production, and testing deployments.
#

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMMICH_DIR="$SCRIPT_DIR"
DEFAULT_UPLOAD_LOCATION="${SCRIPT_DIR}/upload"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo ""
    echo "=================================================================="
    echo "  Immich Multi-Face Search Feature Deployment"
    echo "=================================================================="
    echo ""
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    
    log_success "All requirements met!"
}

setup_environment() {
    log_info "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        log_info "Creating .env file..."
        cat > .env << EOF
# Multi-Face Search Feature Environment Configuration

# Database Configuration
DB_PASSWORD=postgres
DB_USERNAME=postgres
DB_DATABASE_NAME=immich
DB_PORT=5432

# Upload Location (change this to your desired path)
UPLOAD_LOCATION=${UPLOAD_LOCATION:-$DEFAULT_UPLOAD_LOCATION}

# Redis Configuration
REDIS_HOSTNAME=redis
REDIS_PORT=6379

# Machine Learning Configuration
MACHINE_LEARNING_ENABLED=true
ML_DEVICE=cpu
ML_REQUEST_THREADS=1
ML_MODEL_TTL=300
ML_FACE_DETECTION=true
ML_FACIAL_RECOGNITION=true

# Logging
LOG_LEVEL=log

# Optional: Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin

# Feature Flags
IMMICH_FEATURE_MULTI_FACE_SEARCH=true
EOF
        log_success "Created .env file with default settings"
    else
        log_info ".env file already exists, using existing configuration"
    fi
    
    # Create upload directory
    UPLOAD_DIR="${UPLOAD_LOCATION:-$DEFAULT_UPLOAD_LOCATION}"
    mkdir -p "$UPLOAD_DIR/photos"
    mkdir -p "$UPLOAD_DIR/postgres"
    
    log_success "Environment setup complete!"
}

build_images() {
    local build_type="$1"
    
    log_info "Building Docker images for $build_type..."
    
    if [ "$build_type" = "production" ]; then
        # Production build
        log_info "Building production images..."
        docker build --target production -t immich-server:multi-face -f server/Dockerfile .
        docker build -t immich-machine-learning:multi-face machine-learning/
    elif [ "$build_type" = "development" ]; then
        # Development build
        log_info "Building development images..."
        docker build --target dev -t immich-server:multi-face -f server/Dockerfile .
        docker build -t immich-machine-learning:multi-face machine-learning/
    else
        log_error "Invalid build type: $build_type"
        exit 1
    fi
    
    log_success "Docker images built successfully!"
}

deploy_stack() {
    local deployment_type="$1"
    
    log_info "Deploying Immich stack ($deployment_type)..."
    
    # Check if stack is already running
    if docker-compose -f docker-compose-multi-face.yml ps | grep -q "Up"; then
        log_warning "Immich stack is already running. Stopping first..."
        docker-compose -f docker-compose-multi-face.yml down
    fi
    
    # Start the stack
    if [ "$deployment_type" = "development" ]; then
        log_info "Starting development stack with monitoring..."
        docker-compose -f docker-compose-multi-face.yml --profile monitoring up -d
    else
        log_info "Starting production stack..."
        docker-compose -f docker-compose-multi-face.yml up -d
    fi
    
    log_success "Immich stack deployed successfully!"
}

wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Attempt $attempt/$max_attempts - Checking service health..."
        
        if docker-compose -f docker-compose-multi-face.yml ps | grep -q "healthy"; then
            log_success "Services are healthy!"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_warning "Services may still be starting up. Check logs manually."
}

verify_deployment() {
    log_info "Verifying multi-face search feature..."
    
    # Check if server is responding
    local server_url="http://localhost:2283"
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$server_url/api/server-info/ping" > /dev/null 2>&1; then
            log_success "Server is responding!"
            break
        fi
        
        log_info "Waiting for server to start (attempt $attempt/$max_attempts)..."
        sleep 5
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Server failed to start within expected time"
        return 1
    fi
    
    # TODO: Add more specific feature verification
    log_success "Deployment verification completed!"
}

show_deployment_info() {
    log_success "Deployment completed successfully!"
    echo ""
    echo "=================================================================="
    echo "  Immich Multi-Face Search Feature - Deployment Information"
    echo "=================================================================="
    echo ""
    echo "🌐 Web Interface:       http://localhost:2283"
    echo "🔧 API Endpoint:        http://localhost:2283/api"
    echo "🤖 Machine Learning:    http://localhost:3003"
    echo "📊 Prometheus:          http://localhost:9090"
    echo "📈 Grafana:             http://localhost:3000"
    echo ""
    echo "📁 Upload Location:     ${UPLOAD_LOCATION:-$DEFAULT_UPLOAD_LOCATION}"
    echo ""
    echo "=================================================================="
    echo "  Multi-Face Search Feature Usage"
    echo "=================================================================="
    echo ""
    echo "✅ ALL PEOPLE (AND):    Find photos with ALL selected people"
    echo "🔄 ANY PEOPLE (OR):     Find photos with ANY selected people"
    echo "👥 ONLY THEM (ONLY):    Find photos with ONLY selected people"
    echo ""
    echo "To use:"
    echo "1. Open web interface at http://localhost:2283"
    echo "2. Navigate to search"
    echo "3. Select multiple people"
    echo "4. Choose search behavior from the toggle"
    echo ""
    echo "=================================================================="
    echo "  Useful Commands"
    echo "=================================================================="
    echo ""
    echo "View logs:              docker-compose -f docker-compose-multi-face.yml logs -f"
    echo "Stop services:          docker-compose -f docker-compose-multi-face.yml down"
    echo "Restart services:       docker-compose -f docker-compose-multi-face.yml restart"
    echo "Check status:           docker-compose -f docker-compose-multi-face.yml ps"
    echo ""
}

cleanup() {
    log_info "Cleaning up deployment..."
    docker-compose -f docker-compose-multi-face.yml down
    log_success "Cleanup completed!"
}

show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  build-dev         Build development images only"
    echo "  build-prod        Build production images only"
    echo "  deploy-dev        Build and deploy development environment"
    echo "  deploy-prod       Build and deploy production environment"
    echo "  stop              Stop all services"
    echo "  restart           Restart all services"
    echo "  logs              Show service logs"
    echo "  status            Show service status"
    echo "  cleanup           Stop services and clean up"
    echo "  help              Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  UPLOAD_LOCATION   Custom upload directory (default: ./upload)"
    echo ""
}

# Main script logic
main() {
    local action="${1:-deploy-prod}"
    
    case "$action" in
        "build-dev")
            print_banner
            check_requirements
            build_images "development"
            ;;
        "build-prod")
            print_banner
            check_requirements
            build_images "production"
            ;;
        "deploy-dev")
            print_banner
            check_requirements
            setup_environment
            build_images "development"
            deploy_stack "development"
            wait_for_services
            verify_deployment
            show_deployment_info
            ;;
        "deploy-prod")
            print_banner
            check_requirements
            setup_environment
            build_images "production"
            deploy_stack "production"
            wait_for_services
            verify_deployment
            show_deployment_info
            ;;
        "stop")
            docker-compose -f docker-compose-multi-face.yml down
            log_success "Services stopped"
            ;;
        "restart")
            docker-compose -f docker-compose-multi-face.yml restart
            log_success "Services restarted"
            ;;
        "logs")
            docker-compose -f docker-compose-multi-face.yml logs -f
            ;;
        "status")
            docker-compose -f docker-compose-multi-face.yml ps
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            log_error "Unknown action: $action"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 