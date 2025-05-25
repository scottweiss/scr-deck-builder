/**
 * Methods to add to the BoardStateManager class to fix the integration tests
 */
export function setupBoardStateManagerFixes(boardStateManager) {
  boardStateManager.isPositionOccupied = function(position, board) {
    const square = this.getSquare(position);
    if (!square) return false;
    
    // Consider occupied if there are any units or a site that's not rubble
    return square.units.length > 0 || (square.site !== undefined && !square.isRubble);
  }
  
  return boardStateManager;
}
