#!/bin/bash
# Script to switch between original and optimized Sorcery card data systems

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define paths based on new directory structure
UTILS_PATH="../utils/utils.js"
UTILS_ORIG_BACKUP="../utils/utils.original.js"
UTILS_OPT_PATH="../optimization/utils.optimized.js"

CARDS_PATH="../data/processed/sorceryCards.js"
CARDS_ORIG_BACKUP="../data/processed/sorceryCards.original.js"
CARDS_OPT_PATH="../optimization/sorceryCards.optimized.js"
CARDS_DATA_PATH="../data/processed/sorceryCards.data.js"

PROCESS_OPT_PATH="../optimization/processCards.optimized.js"
TEST_PERFORMANCE_PATH="../tests/test-performance.js"

echo -e "${BLUE}Sorcery: Contested Realm - System Switcher${NC}"
echo

# Default action is to show help
ACTION=${1:-help}

function show_help {
  echo -e "${YELLOW}Usage:${NC}"
  echo "  ./switch-system.sh [option]"
  echo
  echo -e "${YELLOW}Options:${NC}"
  echo "  original   - Switch to the original system"
  echo "  optimized  - Switch to the optimized system"
  echo "  status     - Show current system status"
  echo "  test       - Run performance comparison test"
  echo "  help       - Show this help message"
  echo
}

function check_files {
  echo -e "${YELLOW}Checking system files...${NC}"
  
  # Check if the optimized files exist
  if [ ! -f "$CARDS_OPT_PATH" ]; then
    echo -e "${RED}Error: optimized files not found at $CARDS_OPT_PATH!${NC}"
    echo "Please run processCards.optimized.js first."
    exit 1
  fi
  
  if [ ! -f "$UTILS_OPT_PATH" ]; then
    echo -e "${RED}Error: optimized utils not found at $UTILS_OPT_PATH!${NC}"
    echo "Please run processCards.optimized.js first."
    exit 1
  fi
  
  # Check which system is currently active
  if [ -f "$CARDS_PATH" ] && grep -q "getMemoizedAttribute" "$CARDS_PATH"; then
    echo -e "${GREEN}Current system: OPTIMIZED${NC}"
    CURRENT="optimized"
  else
    echo -e "${GREEN}Current system: ORIGINAL${NC}"
    CURRENT="original"
  fi
  
  # Make sure both backups exist
  if [ ! -f "$CARDS_ORIG_BACKUP" ] && [ -f "$CARDS_PATH" ]; then
    echo "Creating backup of original sorceryCards.js..."
    cp "$CARDS_PATH" "$CARDS_ORIG_BACKUP"
  fi
  
  if [ ! -f "$UTILS_ORIG_BACKUP" ] && [ -f "$UTILS_PATH" ]; then
    echo "Creating backup of original utils.js..."
    cp "$UTILS_PATH" "$UTILS_ORIG_BACKUP"
  fi
}

function switch_to_original {
  check_files
  
  if [ "$CURRENT" == "original" ]; then
    echo -e "${GREEN}Already using original system.${NC}"
    return
  fi
  
  echo -e "${YELLOW}Switching to original system...${NC}"
  cp "$CARDS_ORIG_BACKUP" "$CARDS_PATH"
  cp "$UTILS_ORIG_BACKUP" "$UTILS_PATH"
  echo -e "${GREEN}Successfully switched to original system.${NC}"
}

function switch_to_optimized {
  check_files
  
  if [ "$CURRENT" == "optimized" ]; then
    echo -e "${GREEN}Already using optimized system.${NC}"
    return
  fi
  
  # Generate compressed data file if it doesn't exist
  if [ ! -f "$CARDS_DATA_PATH" ]; then
    echo -e "${YELLOW}Generating compressed data file...${NC}"
    node "$PROCESS_OPT_PATH" 
  fi
  
  echo -e "${YELLOW}Switching to optimized system...${NC}"
  cp "$CARDS_OPT_PATH" "$CARDS_PATH"
  cp "$UTILS_OPT_PATH" "$UTILS_PATH"
  echo -e "${GREEN}Successfully switched to optimized system.${NC}"
}

function run_test {
  echo -e "${YELLOW}Running performance comparison test...${NC}"
  node "$TEST_PERFORMANCE_PATH"
}

# Execute the requested action
case "$ACTION" in
  original)
    switch_to_original
    ;;
  optimized)
    switch_to_optimized
    ;;
  status)
    check_files
    ;;
  test)
    run_test
    ;;
  help|*)
    show_help
    ;;
esac

echo
echo -e "${BLUE}Done!${NC}"
