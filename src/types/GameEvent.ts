export interface GameEvent {
    type: string; // e.g., 'info', 'gameStart', 'turnChange'
    message: string;
    timestamp: Date;
    // Add other relevant fields as necessary
}
