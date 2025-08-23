#!/bin/bash

# Custom Branding Build Script
# Usage: ./build-with-branding.sh [client-config-file]
# Example: ./build-with-branding.sh ./branding-configs/client-abc.json

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANDING_CONFIG_FILE="${1:-}"
BUILD_DIR="dist"

echo "🎨 Building with custom branding..."

# Function to extract color from JSON config
extract_color() {
    local config_file="$1"
    local color_key="$2"
    local default_value="$3"
    
    if [[ -f "$config_file" ]]; then
        # Use jq if available, otherwise fall back to basic parsing
        if command -v jq &> /dev/null; then
            jq -r ".$color_key // \"$default_value\"" "$config_file"
        else
            # Basic grep/sed fallback for systems without jq
            grep "\"$color_key\"" "$config_file" | sed 's/.*": *"\([^"]*\)".*/\1/' || echo "$default_value"
        fi
    else
        echo "$default_value"
    fi
}

# Default colors (Morning Lavender)
PRIMARY_COLOR="#8B4513"
SECONDARY_COLOR="#E6E6FA"
ACCENT_COLOR="#DDA0DD"
TEXT_COLOR="#374151"
BACKGROUND_COLOR="#F9FAFB"
COMPANY_NAME="Morning Lavender"

# Override with custom branding if config file provided
if [[ -n "$BRANDING_CONFIG_FILE" && -f "$BRANDING_CONFIG_FILE" ]]; then
    echo "📋 Loading branding config from: $BRANDING_CONFIG_FILE"
    
    PRIMARY_COLOR=$(extract_color "$BRANDING_CONFIG_FILE" "primary_color" "$PRIMARY_COLOR")
    SECONDARY_COLOR=$(extract_color "$BRANDING_CONFIG_FILE" "secondary_color" "$SECONDARY_COLOR")
    ACCENT_COLOR=$(extract_color "$BRANDING_CONFIG_FILE" "accent_color" "$ACCENT_COLOR")
    TEXT_COLOR=$(extract_color "$BRANDING_CONFIG_FILE" "text_color" "$TEXT_COLOR")
    BACKGROUND_COLOR=$(extract_color "$BRANDING_CONFIG_FILE" "background_color" "$BACKGROUND_COLOR")
    COMPANY_NAME=$(extract_color "$BRANDING_CONFIG_FILE" "company_name" "$COMPANY_NAME")
    
    echo "  Primary Color: $PRIMARY_COLOR"
    echo "  Secondary Color: $SECONDARY_COLOR"
    echo "  Background Color: $BACKGROUND_COLOR"
    echo "  Company Name: $COMPANY_NAME"
fi

# Set environment variables for the build
export VITE_CUSTOM_PRIMARY_COLOR="$PRIMARY_COLOR"
export VITE_CUSTOM_SECONDARY_COLOR="$SECONDARY_COLOR"
export VITE_CUSTOM_ACCENT_COLOR="$ACCENT_COLOR"
export VITE_CUSTOM_TEXT_COLOR="$TEXT_COLOR"
export VITE_CUSTOM_BACKGROUND_COLOR="$BACKGROUND_COLOR"
export VITE_CUSTOM_COMPANY_NAME="$COMPANY_NAME"

echo "🔧 Building application..."
npm run build

echo "🎨 Injecting custom branding into HTML..."

# Create custom branding CSS
CUSTOM_CSS="<style>
:root {
  --primary-color: $PRIMARY_COLOR !important;
  --secondary-color: $SECONDARY_COLOR !important;
  --accent-color: $ACCENT_COLOR !important;
  --text-color: $TEXT_COLOR !important;
  --background-color: $BACKGROUND_COLOR !important;
}
body {
  background-color: $BACKGROUND_COLOR !important;
  color: $TEXT_COLOR !important;
  transition: none !important;
}
</style>"

# Inject custom CSS into the HTML file
if [[ -f "$BUILD_DIR/index.html" ]]; then
    # Replace the placeholder comment with custom CSS
    sed -i.backup "s|<!-- CUSTOM_BRANDING_CSS_INJECTION -->|$CUSTOM_CSS|g" "$BUILD_DIR/index.html"
    
    # Update title with company name
    sed -i.backup "s|<title>.*</title>|<title>$COMPANY_NAME - Inventory Management</title>|g" "$BUILD_DIR/index.html"
    
    # Remove backup file
    rm -f "$BUILD_DIR/index.html.backup"
    
    echo "✅ Custom branding injected successfully!"
else
    echo "❌ Build failed - index.html not found"
    exit 1
fi

echo "🚀 Build complete with custom branding!"
echo "📁 Output directory: $BUILD_DIR"
